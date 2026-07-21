// Decides WHEN the coach should speak up on its own, so strategic advice lands
// at meaningful moments instead of every single move (which is costly and gets
// tuned out). Two kinds of trigger:
//
//   1. Cadence   — at least every `maxGapPlies`, and never more often than
//                  `minGapPlies`, so there's always a rhythm.
//   2. Turning points — phase changes, major-piece trades, pawn-structure
//                  shifts, or big evaluation swings fire early (but still
//                  respect a small anti-spam gap).
//
// All thresholds live in one config object so coaching frequency is easy to
// tune (see README > "Tuning the coach").

export const DEFAULT_TRIGGER_CONFIG = {
  minGapPlies: 6, // ~3 full moves: never coach more often than this
  maxGapPlies: 10, // ~5 full moves: always coach at least this often
  turningPointGapPlies: 3, // small guard so turning points don't spam
  evalSwingCp: 150, // centipawn swing that counts as a turning point
};

function countHeavy(features) {
  const m = features?.material;
  if (!m) return 0;
  return m.white.r + m.white.q + m.black.r + m.black.q;
}

function totalPawns(features) {
  const p = features?.pawns;
  if (!p) return 0;
  return p.white.count + p.black.count;
}

function structureSignature(features) {
  const p = features?.pawns;
  if (!p) return '';
  const s = (side) => `${side.doubled.join('')}|${side.isolated.length}|${side.passed.length}`;
  return `${s(p.white)}#${s(p.black)}`;
}

/**
 * @param {object} args
 * @param {number} args.ply current half-move count
 * @param {number} args.lastCoachedPly ply at which the coach last spoke (-Infinity if never)
 * @param {object|null} args.prevFeatures features snapshot at the previous coaching point (or prior move)
 * @param {object} args.features current features snapshot
 * @param {number|null} args.prevEvalCp previous eval (white-perspective cp)
 * @param {number|null} args.evalCp current eval (white-perspective cp)
 * @param {object} [args.config]
 * @returns {{trigger:boolean, reason:string|null}}
 */
export function evaluateTrigger({
  ply,
  lastCoachedPly,
  prevFeatures,
  features,
  prevEvalCp,
  evalCp,
  config = DEFAULT_TRIGGER_CONFIG,
}) {
  const gap = ply - lastCoachedPly;

  // Hard cadence ceiling — always coach at least this often.
  if (gap >= config.maxGapPlies) {
    return { trigger: true, reason: 'periodic check-in' };
  }

  // Below the minimum gap we stay quiet regardless of what happened.
  if (gap < config.turningPointGapPlies) {
    return { trigger: false, reason: null };
  }

  // Turning points (only once we're past the small anti-spam gap).
  if (prevFeatures) {
    if (prevFeatures.phase !== features.phase) {
      return {
        trigger: true,
        reason:
          prevFeatures.phase === 'opening'
            ? 'the opening has finished — time to form a middlegame plan'
            : `the game moved from ${prevFeatures.phase} to ${features.phase}`,
      };
    }
    if (countHeavy(prevFeatures) - countHeavy(features) >= 1) {
      return { trigger: true, reason: 'a major piece (rook/queen) was traded' };
    }
    if (totalPawns(prevFeatures) - totalPawns(features) >= 1) {
      return { trigger: true, reason: 'the pawn structure just changed' };
    }
    if (structureSignature(prevFeatures) !== structureSignature(features)) {
      return { trigger: true, reason: 'the pawn structure just changed' };
    }
  }

  if (
    prevEvalCp != null &&
    evalCp != null &&
    Math.abs(evalCp - prevEvalCp) >= config.evalSwingCp
  ) {
    return { trigger: true, reason: 'the evaluation swung sharply' };
  }

  // Reached the minimum cadence gap with nothing special — a gentle check-in.
  if (gap >= config.minGapPlies) {
    return { trigger: true, reason: 'periodic check-in' };
  }

  return { trigger: false, reason: null };
}
