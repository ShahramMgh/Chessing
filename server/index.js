import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { COACH_SYSTEM_PROMPT, buildUserMessage } from './coachPrompt.js';
import { getCoachProvider } from './providers.js';

const PORT = process.env.PORT || 3001;
const provider = getCoachProvider();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: provider.name, model: provider.model, coachEnabled: provider.enabled });
});

/**
 * POST /api/coach
 * Streams the coach's Persian explanation back as chunked plain text so the
 * frontend can render it token-by-token into the speech bubble.
 *
 * Body: { features, engine, playerColor, reason, mode, userQuestion, history }
 */
app.post('/api/coach', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering
  res.flushHeaders?.();

  // Graceful degradation: with no provider the game still works; we just tell
  // the player (in Persian) that the coach is offline.
  if (!provider.enabled || !provider.stream) {
    res.write(
      'مربی هوش مصنوعی هنوز فعال نشده است. برای فعال‌سازی، کلید Anthropic را در فایل server/.env قرار دهید ' +
        '(یا یک مدل محلی مانند LM Studio را از طریق OPENAI_BASE_URL تنظیم کنید). ' +
        'در این حالت بازی، نوار ارزیابی و نشان‌های کیفیت حرکت همچنان کار می‌کنند.'
    );
    return res.end();
  }

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  try {
    const userMessage = buildUserMessage(req.body || {});
    await provider.stream({
      system: COACH_SYSTEM_PROMPT,
      userMessage,
      onText: (delta) => res.write(delta),
      signal: controller.signal,
    });
    res.end();
  } catch (err) {
    if (controller.signal.aborted) return; // client left; nothing to report
    console.error('[coach] error:', err?.status, err?.message || err);
    try {
      res.write('\n\n[خطا در ارتباط با مربی. لطفاً بعداً دوباره تلاش کنید.]');
    } catch {
      /* ignore */
    }
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`[chessmentor] coach backend on http://localhost:${PORT}`);
  console.log(
    `[chessmentor] provider: ${provider.name} | model: ${provider.model} | coach ${
      provider.enabled ? 'ENABLED' : 'DISABLED'
    }`
  );
});
