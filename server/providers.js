// Coach LLM provider abstraction.
// ------------------------------------------------------------------
// Two backends are supported behind one streaming interface:
//
//   • "anthropic" — Claude via the official @anthropic-ai/sdk (production path,
//                   model claude-sonnet-4-6 as specified in the project brief).
//   • "local"     — any OpenAI-compatible server (e.g. LM Studio) for offline
//                   testing without an Anthropic key. Uses plain fetch + SSE so
//                   no extra dependency is needed.
//
// Selection (first match wins):
//   COACH_PROVIDER env var → else ANTHROPIC_API_KEY present → "anthropic"
//   → else OPENAI_BASE_URL present → "local" → else "none" (offline message).
//
// Every provider exposes: { name, model, enabled, stream({system, userMessage, onText, signal}) }

import Anthropic from '@anthropic-ai/sdk';

function pickProviderName() {
  if (process.env.COACH_PROVIDER) return process.env.COACH_PROVIDER.toLowerCase();
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_BASE_URL) return 'local';
  return 'none';
}

// ---- Anthropic (Claude) --------------------------------------------------

function makeAnthropicProvider() {
  const model = process.env.COACH_MODEL || 'claude-sonnet-4-6';
  const enabled = !!process.env.ANTHROPIC_API_KEY;
  const client = enabled ? new Anthropic() : null;

  return {
    name: 'anthropic',
    model,
    enabled,
    async stream({ system, userMessage, onText, signal }) {
      const s = client.messages.stream({
        model,
        max_tokens: 1024,
        system,
        // Snappy coaching — the heavy chess reasoning is already done by
        // Stockfish + the feature extractor, so the model just needs to explain.
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        messages: [{ role: 'user', content: userMessage }],
      });
      s.on('text', (delta) => onText(delta));
      if (signal) signal.addEventListener('abort', () => s.abort(), { once: true });
      await s.finalMessage();
    },
  };
}

// ---- Local / OpenAI-compatible (LM Studio, etc.) -------------------------

function normaliseBaseUrl(url) {
  const trimmed = (url || 'http://127.0.0.1:5004/v1').replace(/\/+$/, '');
  // Accept both ".../v1" and a bare host; the chat endpoint lives under /v1.
  return /\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

function makeLocalProvider() {
  const baseUrl = normaliseBaseUrl(process.env.OPENAI_BASE_URL);
  const model = process.env.LOCAL_MODEL || 'gemma4-12b-qat-uncensored-hauhaucs-balanced';
  const apiKey = process.env.OPENAI_API_KEY || 'lm-studio'; // LM Studio ignores the value

  return {
    name: `local (${model})`,
    model,
    enabled: true,
    async stream({ system, userMessage, onText, signal }) {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!resp.ok || !resp.body) {
        const detail = await resp.text().catch(() => '');
        throw new Error(`local LLM ${resp.status}: ${detail.slice(0, 200)}`);
      }

      // Parse the OpenAI-style SSE stream: lines of `data: {json}` / `data: [DONE]`.
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep the (possibly partial) last line
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) onText(delta);
          } catch {
            /* ignore keep-alive / partial lines */
          }
        }
      }
    },
  };
}

// ---- Factory -------------------------------------------------------------

export function getCoachProvider() {
  const name = pickProviderName();
  if (name === 'anthropic') return makeAnthropicProvider();
  if (name === 'local' || name === 'openai') return makeLocalProvider();
  return { name: 'none', model: null, enabled: false, stream: null };
}
