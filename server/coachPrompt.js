// Coach persona & prompt construction.
// Kept in its own file so tone/personality can be tuned without touching server
// logic. Edit COACH_SYSTEM_PROMPT to change how "Master Kian" behaves.

export const COACH_SYSTEM_PROMPT = `You are "Master Kian" (استاد کیان), a sharp, encouraging chess coach.

You are given structured JSON about a position (pawn structure, king safety, piece
activity, material) plus engine evaluation lines. You do NOT calculate chess yourself —
trust the provided engine data completely.

Your job: give the STRATEGIC IDEA and a concrete PLAN, tied to a real feature of the
position (an open file, a weak pawn, the safer king, an outpost) — not the engine's exact move.

STYLE — this matters most:
- Be VERY brief: at most 2 short sentences, ~35 words total.
- No greeting or preamble ("Hi", "Since we are...", "In this position..."). Start with the idea.
- No lists, no headings, no move-by-move narration.
- Plain text. Use standard algebraic notation exactly as given in the engine lines.
- Respond in the language requested in the user message.
- Never invent moves or evals; be honest if the position is unclear.`;

/**
 * Build the human-readable "user" message from the structured payload. We hand
 * the model the engine's own numbers and the extracted features so it can reason
 * about strategy without ever seeing the raw board.
 *
 * @param {object} payload
 * @returns {string}
 */
export function buildUserMessage(payload) {
  const {
    features = {},
    engine = {},
    playerColor = 'white',
    reason = '',
    mode = 'coached',
    userQuestion = '',
    history = [],
    language = 'fa',
  } = payload;

  const LANG_NAME = { en: 'English', fr: 'French', fa: 'Persian (Farsi)' };
  const replyLanguage = LANG_NAME[language] || 'Persian (Farsi)';

  const lines = (engine.lines || [])
    .map((l, i) => {
      const pv = (l.pvSan || []).slice(0, 6).join(' ');
      return `  ${i + 1}. ${l.moveSan} (eval ${l.evalText}) — ${pv}`;
    })
    .join('\n');

  const recent = history.length ? history.slice(-12).join(' ') : '(game just started)';

  const base = `Learner plays ${playerColor.toUpperCase()}. ${
    features.sideToMove ? features.sideToMove.toUpperCase() : '?'
  } to move. Engine eval (White's view): ${engine.evalText ?? 'n/a'}. Phase: ${
    features.phase ?? 'unknown'
  }.
Recent moves: ${recent}
Engine top lines:
${lines || '  (none)'}
Position features (JSON):
${JSON.stringify(features)}
`;

  if (mode === 'ask' && userQuestion) {
    return `${base}
The learner asks: "${userQuestion}"
Answer it in 1-2 short sentences, concrete and grounded in the data above. Reply in ${replyLanguage}.`;
  }

  return `${base}
Coach the learner now (flagged: ${reason || 'periodic check-in'}).
In 1-2 short sentences: name the concrete plan for their side and one thing to watch out for.
Be brief and specific — no preamble. Reply in ${replyLanguage}.`;
}
