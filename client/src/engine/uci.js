// Helpers for parsing the small slice of the UCI protocol we care about.
// See https://backscattering.de/chess/uci/ for the full spec.

/**
 * Parse a single `info ...` line emitted by Stockfish during a search.
 * Returns null for info lines that don't carry a principal variation
 * (e.g. `info string ...` or `info depth 1 currmove ...`).
 *
 * @param {string} line
 * @returns {{depth:number, multipv:number, score:{type:'cp'|'mate', value:number}, pv:string[], nps:number, nodes:number, time:number} | null}
 */
export function parseInfoLine(line) {
  if (!line.startsWith('info') || !line.includes(' pv ')) return null;
  const tokens = line.split(/\s+/);

  const out = {
    depth: 0,
    multipv: 1,
    score: { type: 'cp', value: 0 },
    pv: [],
    nps: 0,
    nodes: 0,
    time: 0,
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    switch (t) {
      case 'depth':
        out.depth = Number(tokens[++i]);
        break;
      case 'multipv':
        out.multipv = Number(tokens[++i]);
        break;
      case 'nps':
        out.nps = Number(tokens[++i]);
        break;
      case 'nodes':
        out.nodes = Number(tokens[++i]);
        break;
      case 'time':
        out.time = Number(tokens[++i]);
        break;
      case 'score': {
        const type = tokens[++i]; // 'cp' or 'mate'
        const value = Number(tokens[++i]);
        out.score = { type, value };
        break;
      }
      case 'pv':
        out.pv = tokens.slice(i + 1);
        i = tokens.length; // pv is always last
        break;
      default:
        break;
    }
  }
  return out;
}

/**
 * Parse a `bestmove e2e4 ponder e7e5` line.
 * @param {string} line
 * @returns {{ bestmove: string|null, ponder: string|null } | null}
 */
export function parseBestMove(line) {
  if (!line.startsWith('bestmove')) return null;
  const tokens = line.split(/\s+/);
  const bestmove = tokens[1] && tokens[1] !== '(none)' ? tokens[1] : null;
  const ponderIdx = tokens.indexOf('ponder');
  const ponder = ponderIdx >= 0 ? tokens[ponderIdx + 1] : null;
  return { bestmove, ponder };
}

/**
 * Normalise a raw score into centipawns from the perspective of the side to
 * move, keeping mate scores separate. A mate is represented as a very large
 * centipawn value so it sorts correctly, while the original mate distance is
 * preserved for display.
 *
 * @param {{type:'cp'|'mate', value:number}} score
 * @returns {{ cp: number|null, mate: number|null, sortValue: number }}
 */
export function normaliseScore(score) {
  if (!score) return { cp: 0, mate: null, sortValue: 0 };
  if (score.type === 'mate') {
    // Positive mate = we deliver mate; negative = we get mated.
    const sign = score.value >= 0 ? 1 : -1;
    return {
      cp: null,
      mate: score.value,
      sortValue: sign * (100000 - Math.abs(score.value)),
    };
  }
  return { cp: score.value, mate: null, sortValue: score.value };
}

/**
 * Convert a UCI move string (e.g. "e2e4", "e7e8q") into its from/to squares
 * and optional promotion piece — the shape chess.js accepts.
 * @param {string} uci
 */
export function uciToMove(uci) {
  if (!uci || uci.length < 4) return null;
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}
