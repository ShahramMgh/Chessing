import { Chess } from 'chess.js';
import { uciToMove } from '../engine/uci.js';

/** 'w' | 'b' — whose move it is in this FEN. */
export function sideToMove(fen) {
  return fen.split(' ')[1] || 'w';
}

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const FULL_SET = { p: 8, n: 2, b: 2, r: 2, q: 1 };

/**
 * From a FEN, work out which pieces each side has lost (i.e. that the opponent
 * captured) and the net material balance in pawns. Used for the captured-piece
 * trays around the board.
 * @param {string} fen
 * @returns {{ whiteCapturedByBlack: object, blackCapturedByWhite: object, diff: number }}
 *   diff > 0 means White is up material.
 */
export function materialSummary(fen) {
  const placement = fen.split(' ')[0];
  const count = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
  for (const ch of placement) {
    const lower = ch.toLowerCase();
    if (PIECE_VALUE[lower] != null) {
      count[ch === ch.toUpperCase() ? 'w' : 'b'][lower] += 1;
    }
  }
  const missing = (side) => {
    const out = {};
    let points = 0;
    for (const t of Object.keys(FULL_SET)) {
      const gone = Math.max(0, FULL_SET[t] - count[side][t]);
      if (gone > 0) out[t] = gone;
      points += (FULL_SET[t] - count[side][t]) * PIECE_VALUE[t];
    }
    return { out, points };
  };
  const w = missing('w'); // white's losses
  const b = missing('b'); // black's losses
  return {
    whiteCapturedByBlack: w.out, // white pieces that are gone
    blackCapturedByWhite: b.out, // black pieces that are gone
    diff: b.points - w.points, // >0 → White is up material
  };
}

/**
 * Convert a side-to-move score into White's perspective (what the eval bar uses).
 * @param {string} fen
 * @param {{cp:number|null, mate:number|null}} score
 */
export function toWhiteScore(fen, score) {
  const flip = sideToMove(fen) === 'b' ? -1 : 1;
  return {
    cp: score.cp == null ? null : score.cp * flip,
    mate: score.mate == null ? null : score.mate * flip,
  };
}

/**
 * Walk a UCI principal variation from a FEN and return the moves in SAN.
 * @param {string} fen
 * @param {string[]} pvUci
 * @param {number} [maxPlies=6]
 * @returns {string[]}
 */
export function pvToSan(fen, pvUci, maxPlies = 6) {
  const chess = new Chess(fen);
  const out = [];
  for (const uci of pvUci.slice(0, maxPlies)) {
    const mv = uciToMove(uci);
    if (!mv) break;
    try {
      const res = chess.move(mv);
      if (!res) break;
      out.push(res.san);
    } catch {
      break;
    }
  }
  return out;
}

/**
 * Turn the first few plies of a PV into board arrows. Only the side-to-move's
 * moves (plies 0, 2, 4...) are returned so the arrows read as "your plan".
 * Colours fade for later moves.
 * @param {string} fen
 * @param {string[]} pvUci
 * @param {number} [maxArrows=3]
 * @returns {Array<[string,string,string]>} react-chessboard customArrows tuples
 */
export function pvToArrows(fen, pvUci, maxArrows = 3) {
  const colours = ['rgba(109, 40, 217, 0.9)', 'rgba(109, 40, 217, 0.55)', 'rgba(109, 40, 217, 0.32)'];
  const arrows = [];
  for (let i = 0; i < pvUci.length && arrows.length < maxArrows; i += 2) {
    const mv = uciToMove(pvUci[i]);
    if (!mv) break;
    arrows.push([mv.from, mv.to, colours[arrows.length] || colours[colours.length - 1]]);
  }
  return arrows;
}
