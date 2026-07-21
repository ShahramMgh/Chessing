// Position Feature Extractor
// ---------------------------
// Reads a FEN and produces a compact, structured JSON description of the
// STRATEGIC character of the position: pawn structure, open files, king safety,
// piece activity, material imbalances, space and game phase.
//
// This JSON — never a board image or raw FEN alone — is what we send to Claude.
// Keeping it pure (a function of the FEN string) makes it trivial to test and
// reason about, and independent of chess.js internals.

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** @typedef {{piece:string,color:'w'|'b',file:number,rank:number}} Sq */

/**
 * Parse the piece-placement field of a FEN into a board indexed [file][rank],
 * where file 0=a..7=h and rank 0=rank1..7=rank8. Empty squares are null.
 */
function parseBoard(placement) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const ranks = placement.split('/'); // rank 8 first
  for (let r = 0; r < 8; r++) {
    const rankStr = ranks[r];
    const rankIndex = 7 - r; // FEN lists rank 8 first
    let file = 0;
    for (const ch of rankStr) {
      if (/\d/.test(ch)) {
        file += Number(ch);
      } else {
        board[file][rankIndex] = ch;
        file += 1;
      }
    }
  }
  return board;
}

const isWhite = (p) => p && p === p.toUpperCase();
const colorOf = (p) => (isWhite(p) ? 'w' : 'b');
const typeOf = (p) => (p ? p.toLowerCase() : null);
const sqName = (f, r) => `${FILES[f]}${r + 1}`;

function collectPieces(board) {
  const list = [];
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const p = board[f][r];
      if (p) list.push({ piece: typeOf(p), color: colorOf(p), file: f, rank: r });
    }
  }
  return list;
}

// ---- Material -------------------------------------------------------------

function material(pieces) {
  const tally = (color) => {
    const t = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    let points = 0;
    for (const pc of pieces) {
      if (pc.color !== color) continue;
      t[pc.piece] += 1;
      points += PIECE_VALUE[pc.piece];
    }
    return { ...t, points };
  };
  const white = tally('w');
  const black = tally('b');
  const imbalances = [];
  if (white.b >= 2 && black.b < 2) imbalances.push('White has the bishop pair');
  if (black.b >= 2 && white.b < 2) imbalances.push('Black has the bishop pair');
  if (white.n > white.b && black.b > black.n) imbalances.push('White has knight(s) vs Black bishop(s)');
  if (black.n > black.b && white.b > white.n) imbalances.push('Black has knight(s) vs White bishop(s)');
  const balance = white.points - black.points;
  return {
    white,
    black,
    balancePawns: balance,
    bishopPair: white.b >= 2 && black.b < 2 ? 'white' : black.b >= 2 && white.b < 2 ? 'black' : null,
    imbalances,
  };
}

// ---- Pawn structure -------------------------------------------------------

function pawnsByColor(pieces, color) {
  return pieces.filter((p) => p.piece === 'p' && p.color === color);
}

function pawnFileMap(pawns) {
  const map = {}; // file index -> [ranks]
  for (const p of pawns) (map[p.file] ||= []).push(p.rank);
  return map;
}

function analysePawns(pieces, color) {
  const pawns = pawnsByColor(pieces, color);
  const own = pawnFileMap(pawns);
  const enemy = pawnFileMap(pawnsByColor(pieces, color === 'w' ? 'b' : 'w'));
  const forward = color === 'w' ? 1 : -1;

  const doubled = [];
  const isolated = [];
  const passed = [];
  const backward = [];

  for (const f of Object.keys(own).map(Number)) {
    if (own[f].length >= 2) doubled.push(FILES[f]);
  }

  for (const p of pawns) {
    const { file: f, rank: r } = p;
    const hasNeighbour = (own[f - 1]?.length || 0) + (own[f + 1]?.length || 0) > 0;
    if (!hasNeighbour) isolated.push(sqName(f, r));

    // Passed: no enemy pawn on same/adjacent file ahead of it.
    const ahead = (file) =>
      (enemy[file] || []).some((er) => (color === 'w' ? er > r : er < r));
    if (!ahead(f) && !ahead(f - 1) && !ahead(f + 1)) passed.push(sqName(f, r));

    // Backward (approx): no friendly pawn on adjacent files at or behind this
    // rank to support an advance, and an enemy pawn controls the square ahead.
    const supported = [f - 1, f + 1].some((nf) =>
      (own[nf] || []).some((nr) => (color === 'w' ? nr <= r : nr >= r))
    );
    if (!supported && !isolated.includes(sqName(f, r))) {
      backward.push(sqName(f, r));
    }
  }

  // Pawn islands = contiguous groups of occupied files.
  const occupiedFiles = Object.keys(own).map(Number).sort((a, b) => a - b);
  let islands = 0;
  for (let i = 0; i < occupiedFiles.length; i++) {
    if (i === 0 || occupiedFiles[i] !== occupiedFiles[i - 1] + 1) islands += 1;
  }

  return {
    count: pawns.length,
    doubled,
    isolated,
    passed,
    backward,
    islands,
  };
}

// ---- Files (open / half-open) & rook control ------------------------------

function fileStructure(pieces) {
  const whitePawnFiles = new Set(pawnsByColor(pieces, 'w').map((p) => p.file));
  const blackPawnFiles = new Set(pawnsByColor(pieces, 'b').map((p) => p.file));

  const open = [];
  const halfOpenForWhite = [];
  const halfOpenForBlack = [];

  for (let f = 0; f < 8; f++) {
    const w = whitePawnFiles.has(f);
    const b = blackPawnFiles.has(f);
    if (!w && !b) open.push(FILES[f]);
    else if (!w && b) halfOpenForWhite.push(FILES[f]); // White has no pawn here
    else if (w && !b) halfOpenForBlack.push(FILES[f]);
  }

  // Which heavy pieces (R/Q) sit on open or half-open files — i.e. contest them.
  const control = {};
  for (const pc of pieces) {
    if (pc.piece !== 'r' && pc.piece !== 'q') continue;
    const file = FILES[pc.file];
    if (open.includes(file) || halfOpenForWhite.includes(file) || halfOpenForBlack.includes(file)) {
      (control[file] ||= { white: [], black: [] });
      control[file][pc.color === 'w' ? 'white' : 'black'].push(
        `${pc.piece.toUpperCase()}${sqName(pc.file, pc.rank)}`
      );
    }
  }

  return { open, halfOpenForWhite, halfOpenForBlack, control };
}

// ---- King safety ----------------------------------------------------------

function kingSafety(board, pieces, color) {
  const king = pieces.find((p) => p.piece === 'k' && p.color === color);
  if (!king) return null;
  const { file: kf, rank: kr } = king;
  const forward = color === 'w' ? 1 : -1;
  const backRank = color === 'w' ? 0 : 7;

  // Pawn shield: friendly pawns one/two ranks in front on the king's file ±1.
  let shieldPawns = 0;
  for (let df = -1; df <= 1; df++) {
    for (let dr = 1; dr <= 2; dr++) {
      const f = kf + df;
      const r = kr + forward * dr;
      if (f < 0 || f > 7 || r < 0 || r > 7) continue;
      const p = board[f][r];
      if (p && typeOf(p) === 'p' && colorOf(p) === color) shieldPawns += 1;
    }
  }

  // Open/half-open files next to the king are danger lanes.
  const files = fileStructure(pieces);
  let openFilesNear = 0;
  for (let df = -1; df <= 1; df++) {
    const f = kf + df;
    if (f < 0 || f > 7) continue;
    const name = FILES[f];
    if (files.open.includes(name)) openFilesNear += 1;
    else if (
      (color === 'w' && files.halfOpenForBlack.includes(name)) ||
      (color === 'b' && files.halfOpenForWhite.includes(name))
    ) {
      openFilesNear += 0.5; // enemy has a half-open file pointing at us
    }
  }

  const castledShort = kr === backRank && kf >= 6;
  const castledLong = kr === backRank && kf <= 2;
  const castled = castledShort ? 'short' : castledLong ? 'long' : null;

  // 0 (very exposed) .. 10 (very safe)
  let score = 5 + shieldPawns * 1.5 - openFilesNear * 2 - (castled ? 0 : 1.5);
  if (kf >= 3 && kf <= 4 && kr === backRank) score -= 1; // uncastled king in the centre
  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  return {
    square: sqName(kf, kr),
    castled,
    shieldPawns,
    openFilesNear,
    score,
  };
}

// ---- Piece activity -------------------------------------------------------

function pawnAttacksSquare(pieces, color, f, r) {
  // Does a pawn of `color` attack square (f,r)?
  const dir = color === 'w' ? 1 : -1;
  return pieces.some(
    (p) =>
      p.piece === 'p' &&
      p.color === color &&
      p.rank === r - dir &&
      Math.abs(p.file - f) === 1
  );
}

function enemyPawnCanAttack(pieces, enemyColor, f, r) {
  // Is there an enemy pawn on an adjacent file that could still advance to
  // attack (f,r)? (Pawns never move backward, so only pawns "ahead" count.)
  const dir = enemyColor === 'w' ? 1 : -1;
  return pieces.some(
    (p) =>
      p.piece === 'p' &&
      p.color === enemyColor &&
      Math.abs(p.file - f) === 1 &&
      (dir === 1 ? p.rank < r : p.rank > r)
  );
}

function activity(board, pieces) {
  const outposts = { white: [], black: [] };
  const rooksOnOpenFiles = { white: [], black: [] };
  const badBishops = { white: [], black: [] };

  const files = fileStructure(pieces);

  for (const pc of pieces) {
    const colorKey = pc.color === 'w' ? 'white' : 'black';
    const enemy = pc.color === 'w' ? 'b' : 'w';

    // Knight/bishop outposts in enemy territory, pawn-defended, unassailable.
    if (pc.piece === 'n' || pc.piece === 'b') {
      const inEnemyHalf = pc.color === 'w' ? pc.rank >= 3 && pc.rank <= 5 : pc.rank <= 4 && pc.rank >= 2;
      if (
        inEnemyHalf &&
        pawnAttacksSquare(pieces, pc.color, pc.file, pc.rank) &&
        !enemyPawnCanAttack(pieces, enemy, pc.file, pc.rank)
      ) {
        outposts[colorKey].push(`${pc.piece.toUpperCase()}${sqName(pc.file, pc.rank)}`);
      }
    }

    // Rooks on open / friendly half-open files.
    if (pc.piece === 'r') {
      const name = FILES[pc.file];
      const halfOpen = pc.color === 'w' ? files.halfOpenForWhite : files.halfOpenForBlack;
      if (files.open.includes(name) || halfOpen.includes(name)) {
        rooksOnOpenFiles[colorKey].push(sqName(pc.file, pc.rank));
      }
    }

    // Bad bishop: many friendly pawns fixed on the bishop's own colour.
    if (pc.piece === 'b') {
      const bishopSquareIsLight = (pc.file + pc.rank) % 2 === 1;
      let sameColorPawns = 0;
      for (const p of pieces) {
        if (p.piece === 'p' && p.color === pc.color) {
          const lightSq = (p.file + p.rank) % 2 === 1;
          if (lightSq === bishopSquareIsLight) sameColorPawns += 1;
        }
      }
      if (sameColorPawns >= 4) {
        badBishops[colorKey].push(`${sqName(pc.file, pc.rank)} (${sameColorPawns} pawns on its colour)`);
      }
    }
  }

  return { outposts, rooksOnOpenFiles, badBishops };
}

// ---- Centre & space -------------------------------------------------------

function centreAndSpace(board, pieces) {
  const centre = [
    [3, 3],
    [4, 3],
    [3, 4],
    [4, 4],
  ]; // d4 e4 d5 e5
  let whiteControl = 0;
  let blackControl = 0;
  for (const [f, r] of centre) {
    const occ = board[f][r];
    if (occ) {
      if (colorOf(occ) === 'w') whiteControl += 1;
      else blackControl += 1;
    }
    if (pawnAttacksSquare(pieces, 'w', f, r)) whiteControl += 1;
    if (pawnAttacksSquare(pieces, 'b', f, r)) blackControl += 1;
  }

  const whiteSpace = pawnsByColor(pieces, 'w').filter((p) => p.rank >= 3).length;
  const blackSpace = pawnsByColor(pieces, 'b').filter((p) => p.rank <= 4).length;

  let note = 'balanced centre';
  if (whiteControl - blackControl >= 2) note = 'White controls the centre';
  else if (blackControl - whiteControl >= 2) note = 'Black controls the centre';

  return { whiteControl, blackControl, whiteSpace, blackSpace, note };
}

// ---- Game phase -----------------------------------------------------------

function gamePhase(pieces, fullmoveNumber) {
  const nonPawnMaterial = pieces
    .filter((p) => p.piece !== 'p' && p.piece !== 'k')
    .reduce((s, p) => s + PIECE_VALUE[p.piece], 0);
  const queens = pieces.filter((p) => p.piece === 'q').length;
  const developedMinors = pieces.filter(
    (p) =>
      (p.piece === 'n' || p.piece === 'b') &&
      !(p.color === 'w' && p.rank === 0) &&
      !(p.color === 'b' && p.rank === 7)
  ).length;

  if ((queens === 0 && nonPawnMaterial <= 20) || nonPawnMaterial <= 12) return 'endgame';
  if (fullmoveNumber <= 12 && developedMinors <= 4) return 'opening';
  return 'middlegame';
}

// ---- Public API -----------------------------------------------------------

/**
 * Extract strategic features from a FEN.
 * @param {string} fen full FEN string
 * @param {{lastMoveSan?:string, inCheck?:boolean}} [meta] optional extras
 * @returns {object} structured strategic description (safe to JSON.stringify)
 */
export function extractFeatures(fen, meta = {}) {
  const [placement, active, , , , fullmove] = fen.split(' ');
  const board = parseBoard(placement);
  const pieces = collectPieces(board);
  const fullmoveNumber = Number(fullmove) || 1;

  return {
    sideToMove: active === 'w' ? 'white' : 'black',
    fullmoveNumber,
    phase: gamePhase(pieces, fullmoveNumber),
    material: material(pieces),
    pawns: {
      white: analysePawns(pieces, 'w'),
      black: analysePawns(pieces, 'b'),
    },
    files: fileStructure(pieces),
    kingSafety: {
      white: kingSafety(board, pieces, 'w'),
      black: kingSafety(board, pieces, 'b'),
    },
    activity: activity(board, pieces),
    centre: centreAndSpace(board, pieces),
    lastMove: meta.lastMoveSan || null,
    inCheck: !!meta.inCheck,
  };
}
