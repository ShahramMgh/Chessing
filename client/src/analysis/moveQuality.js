// Move-quality classification — engine-only, instant, no LLM involved.
//
// We convert centipawn evaluations into a win probability (a Lichess-style
// logistic model) and classify a move by how much win probability the mover
// gave up compared to the best available move. Win% is far more meaningful than
// raw centipawns: losing 200cp when you're already +900 barely matters, but
// losing 200cp near equality is a real blunder.

const MATE_CP = 100000;

/** Piece values in pawns, for the light "was this a sacrifice?" heuristic. */
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Collapse a normalised score {cp, mate} into a single centipawn number.
 * Mate is treated as a huge value so it saturates the win-probability curve.
 * @param {{cp:number|null, mate:number|null}} score
 */
export function scoreToCp(score) {
  if (!score) return 0;
  if (score.mate != null) return score.mate > 0 ? MATE_CP : -MATE_CP;
  return Math.max(-MATE_CP, Math.min(MATE_CP, score.cp ?? 0));
}

/**
 * Win probability in [0,1] for the side the centipawns are measured from.
 * Constant is Lichess's fitted value.
 * @param {number} cp centipawns from the perspective of the side to move
 */
export function winProbability(cp) {
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

/**
 * Classify a played move.
 *
 * @param {object} args
 * @param {{cp:number|null,mate:number|null}} args.beforeScore best score available BEFORE the move, from the mover's perspective
 * @param {{cp:number|null,mate:number|null}} args.afterScore  score AFTER the move, already flipped to the mover's perspective
 * @param {boolean} args.isBestMove whether the played move matched the engine's #1 choice
 * @param {object} [args.playedMove] chess.js move object (has .piece, .captured)
 * @returns {{key:'brilliant'|'good'|'inaccuracy'|'mistake'|'blunder', winLoss:number, cpLoss:number, isBest:boolean}}
 */
export function classifyMove({ beforeScore, afterScore, isBestMove, playedMove }) {
  const beforeCp = scoreToCp(beforeScore);
  const afterCp = scoreToCp(afterScore);

  const winBefore = winProbability(beforeCp);
  const winAfter = winProbability(afterCp);
  const winLoss = Math.max(0, (winBefore - winAfter) * 100); // percentage points
  const cpLoss = Math.max(0, beforeCp - afterCp);

  let key;
  if (winLoss >= 30) key = 'blunder';
  else if (winLoss >= 15) key = 'mistake';
  else if (winLoss >= 8) key = 'inaccuracy';
  else key = 'good';

  // Brilliancy: a best (or near-best) move that gives up material but keeps the
  // position at least equal. A light heuristic — good enough to celebrate real
  // sacrifices without firing on every trade.
  if ((key === 'good') && (isBestMove || winLoss <= 2) && afterCp > -50 && isSacrifice(playedMove)) {
    key = 'brilliant';
  }

  return { key, winLoss, cpLoss, isBest: !!isBestMove };
}

/**
 * Heuristic: did the move give up material immediately? True when it captures a
 * cheaper piece with a dearer one, or moves a valuable piece onto a square the
 * opponent could grab (approximated by the move being flagged as a capture of
 * lower value). Board-level SEE is intentionally avoided to keep this instant.
 * @param {object} [move] chess.js move object
 */
function isSacrifice(move) {
  if (!move || !move.piece) return false;
  const moverValue = PIECE_VALUE[move.piece] ?? 0;
  if (move.captured) {
    const capturedValue = PIECE_VALUE[move.captured] ?? 0;
    return moverValue - capturedValue >= 2; // e.g. rook takes knight, queen takes bishop
  }
  // Non-capturing sacrifices (e.g. a piece offered on an empty square) are hard
  // to detect without an attack map; we skip them to avoid false positives.
  return false;
}
