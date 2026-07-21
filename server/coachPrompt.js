// Coach persona & prompt construction.
// Kept in its own file so tone/personality can be tuned without touching server
// logic. Edit COACH_SYSTEM_PROMPT to change how "Master Kian" behaves.

export const COACH_SYSTEM_PROMPT = `You are "Master Kian" (استاد کیان), an encouraging, sharp Persian-speaking chess coach.
You are given structured JSON data about a chess position (pawn structure, king safety,
piece activity, material) plus engine evaluation lines. You do NOT calculate chess yourself —
trust the provided engine data completely.

Your job is to explain the STRATEGIC PICTURE and a concrete multi-move PLAN, not just
restate the engine's best move. Always connect the plan to a concrete feature of the
position (e.g. "because the c-file is open and your rook is more active").

Respond in the language requested in the user message (Persian, English, or French), in a warm,
encouraging, slightly playful tone. Keep explanations concise (3-5 sentences) unless the user asks
for more detail. Use simple analogies when helpful. Never claim a plan is calculated to be winning
if the engine eval doesn't support it — be honest about uncertainty in complex positions.

Formatting rules:
- Write plain Persian text. Do not use Markdown headings or code blocks.
- When you name chess moves, use standard algebraic notation exactly as given in the engine lines.
- Do not invent moves or evaluations that are not in the provided data.`;

/**
 * Build the human-readable "user" message from the structured payload. We hand
 * Claude the engine's own numbers and the extracted features so it can reason
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
      return `  ${i + 1}. move ${l.moveSan} (eval ${l.evalText}) — line: ${pv}`;
    })
    .join('\n');

  const recent = history.length ? history.slice(-12).join(' ') : '(game just started)';

  const base = `The learner is playing ${playerColor.toUpperCase()}. It is ${
    features.sideToMove ? features.sideToMove.toUpperCase() : '?'
  } to move.

Engine evaluation (from White's perspective): ${engine.evalText ?? 'n/a'}
Game phase: ${features.phase ?? 'unknown'}
Recent moves: ${recent}

Engine's top candidate moves and lines:
${lines || '  (none provided)'}

Structured strategic features (JSON):
${JSON.stringify(features, null, 2)}
`;

  if (mode === 'ask' && userQuestion) {
    return `${base}
The learner asks you directly: "${userQuestion}"

Answer their question specifically and warmly, grounded in the engine data and the strategic
features above. If it's a "why not this move?" question, explain what the engine data implies
about that idea. Keep it concise unless they ask for depth.

Write your entire reply in ${replyLanguage}.`;
  }

  return `${base}
Coach the learner right now. This moment was flagged because: ${reason || 'a periodic check-in'}.

In your reply (3-5 sentences, warm):
1. Name the KEY strategic theme of this position right now.
2. Give a concrete multi-move PLAN for the learner's side (e.g. "double rooks on the c-file, then land a knight on d5").
3. Tie the plan to a specific feature above (pawn structure, open file, king safety, piece activity...).
4. Mention ONE thing to avoid or a trap to watch for.

Write your entire reply in ${replyLanguage}.`;
}
