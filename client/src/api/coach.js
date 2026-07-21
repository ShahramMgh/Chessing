// Client for the streaming /api/coach endpoint. Reads the chunked plain-text
// response and delivers it to `onChunk` token-by-token so the UI can render the
// coach's words as they arrive.

/**
 * @param {object} payload  { features, engine, playerColor, reason, mode, userQuestion, history }
 * @param {(chunk:string)=>void} onChunk called with each text delta
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} the full accumulated text
 */
export async function streamCoach(payload, onChunk, signal) {
  const resp = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`coach request failed: ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }
  return full;
}

/** Simple health probe so the UI can show whether the coach is enabled. */
export async function fetchCoachHealth() {
  try {
    const resp = await fetch('/api/health');
    if (!resp.ok) return { coachEnabled: false };
    return await resp.json();
  } catch {
    return { coachEnabled: false };
  }
}
