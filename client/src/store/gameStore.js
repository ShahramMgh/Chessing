import { create } from 'zustand';
import { Chess } from 'chess.js';
import { getEngine } from '../engine/stockfishEngine.js';
import { uciToMove } from '../engine/uci.js';
import { classifyMove } from '../analysis/moveQuality.js';
import { extractFeatures } from '../analysis/positionFeatures.js';
import { evaluateTrigger, DEFAULT_TRIGGER_CONFIG } from '../analysis/coachTrigger.js';
import { sideToMove, toWhiteScore, pvToSan, pvToArrows } from '../lib/chessUtils.js';
import { formatEval, getDict } from '../lib/i18n.js';
import { streamCoach } from '../api/coach.js';

const savedLang =
  (typeof localStorage !== 'undefined' && localStorage.getItem('cm_lang')) || 'en';

// Depth budgets — shallow enough to feel instant, deep enough to be honest.
const EVAL_DEPTH = 12; // eval bar, move quality, plan baseline
const COACH_DEPTH = 14; // richer analysis behind a coaching moment
const COACH_MULTIPV = 3;

const engine = getEngine();

// --- Non-reactive session scratch (kept out of React state to avoid re-renders) ---
let game = new Chess();
let preMove = null; // { fen, moverScore, bestUci } — baseline for the next move's quality
let lastCoachedPly = -Infinity;
let prevFeatures = null;
let prevEvalCp = 0;
let coachAbort = null;
let toastSeq = 0;

const START_STATS = () => ({
  playerMoves: 0,
  brilliant: 0,
  good: 0,
  inaccuracy: 0,
  mistake: 0,
  blunder: 0,
  winLossSum: 0,
  cpLossSum: 0,
});

/** Analyse a FEN and also return the eval from White's perspective. */
async function analyzeWhite(fen, opts) {
  const result = await engine.analyze(fen, opts);
  const top = result.lines[0] || { cp: 0, mate: null, pv: [], move: null };
  const white = toWhiteScore(fen, { cp: top.cp, mate: top.mate });
  return { ...result, top, white };
}

export const useGameStore = create((set, get) => ({
  // --- lifecycle ---
  engineReady: false,
  engineError: null,
  started: false,

  // --- game ---
  fen: game.fen(),
  history: [], // [{ san, from, to, color, quality }]
  lastMove: null, // { from, to }
  playerColor: 'w',
  status: 'menu', // 'menu' | 'playing' | 'over'
  result: null, // { outcome: 'win'|'loss'|'draw', reason }
  thinking: false,

  // --- settings ---
  mode: 'coached', // 'silent' | 'coached' | 'ask'
  skill: 5,
  lang: savedLang, // 'en' | 'fr' | 'fa'

  // --- evaluation / feedback ---
  evalCp: 0,
  evalMate: null,
  toasts: [], // [{ id, key }]

  // --- coach ---
  coach: {
    open: false,
    streaming: false,
    text: '',
    arrows: [],
    error: null,
    reason: null,
  },

  // --- difficulty suggestion ---
  suggestion: null, // 'up' | 'down' | null

  // ---------------------------------------------------------------------
  //  Engine boot
  // ---------------------------------------------------------------------
  async initEngine() {
    if (get().engineReady) return;
    try {
      await engine.init();
      set({ engineReady: true });
    } catch (err) {
      console.error('[engine] init failed', err);
      set({ engineError: String(err?.message || err) });
    }
  },

  // ---------------------------------------------------------------------
  //  New game
  // ---------------------------------------------------------------------
  async newGame({ playerColor = 'w', skill } = {}) {
    // reset scratch
    game = new Chess();
    preMove = null;
    lastCoachedPly = -Infinity;
    prevFeatures = null;
    prevEvalCp = 0;
    if (coachAbort) coachAbort.abort();

    set({
      fen: game.fen(),
      history: [],
      lastMove: null,
      playerColor,
      status: 'playing',
      result: null,
      thinking: false,
      evalCp: 0,
      evalMate: null,
      toasts: [],
      suggestion: null,
      stats: START_STATS(),
      skill: skill ?? get().skill,
      started: true,
      coach: { open: false, streaming: false, text: '', arrows: [], error: null, reason: null },
    });

    await get().initEngine();
    if (!get().engineReady) return;

    if (playerColor === 'b') {
      // Engine (White) opens.
      await get()._engineMove();
    } else {
      await get()._analyzeForTurn();
    }
  },

  setMode(mode) {
    set({ mode });
  },

  setSkill(skill) {
    set({ skill: Math.max(0, Math.min(20, skill)) });
  },

  setLang(lang) {
    try {
      localStorage.setItem('cm_lang', lang);
    } catch {
      /* ignore */
    }
    set({ lang });
  },

  // ---------------------------------------------------------------------
  //  Player move (called synchronously by react-chessboard; returns bool)
  // ---------------------------------------------------------------------
  onPlayerDrop(from, to) {
    const s = get();
    if (s.status !== 'playing' || s.thinking) return false;
    if (game.turn() !== s.playerColor) return false;

    const prevFen = game.fen();
    let moveResult;
    try {
      moveResult = game.move({ from, to, promotion: 'q' }); // auto-queen
    } catch {
      return false;
    }
    if (!moveResult) return false;

    // Reflect the move immediately for a snappy feel.
    set({
      fen: game.fen(),
      lastMove: { from, to },
      history: buildHistory(s.history),
      coach: { ...s.coach, arrows: [] },
    });

    // Everything else (quality, eval, engine reply, coaching) runs async.
    get()._afterPlayerMove(prevFen, moveResult);
    return true;
  },

  // Legal destination squares from a given square — used for click-to-move and
  // hover hints on the board. Only active on the player's own turn.
  movesFrom(square) {
    const s = get();
    if (s.status !== 'playing' || s.thinking || game.turn() !== s.playerColor) return [];
    try {
      return game
        .moves({ square, verbose: true })
        .map((m) => ({ to: m.to, capture: !!m.captured || m.flags.includes('e') }));
    } catch {
      return [];
    }
  },

  // ---------------------------------------------------------------------
  //  Post-move pipeline
  // ---------------------------------------------------------------------
  async _afterPlayerMove(prevFen, moveResult) {
    if (!get().engineReady) return;
    const afterFen = game.fen();

    try {
      // 1) Baseline eval (player perspective) — reuse cache when possible.
      let beforeScore;
      let bestUci;
      if (preMove && preMove.fen === prevFen) {
        beforeScore = preMove.moverScore;
        bestUci = preMove.bestUci;
      } else {
        const before = await engine.analyze(prevFen, { depth: EVAL_DEPTH, multipv: 1 });
        const top = before.lines[0] || { cp: 0, mate: null, move: null };
        beforeScore = { cp: top.cp, mate: top.mate };
        bestUci = top.move;
      }

      // 2) Eval after the move (analysis is from the opponent's perspective).
      const after = await analyzeWhite(afterFen, { depth: EVAL_DEPTH, multipv: 1 });
      const afterMoverScore = { cp: negate(after.top.cp), mate: negate(after.top.mate) };

      set({ evalCp: after.white.cp ?? 0, evalMate: after.white.mate });

      // 3) Classify + record.
      const playedUci = moveResult.from + moveResult.to + (moveResult.promotion || '');
      const q = classifyMove({
        beforeScore,
        afterScore: afterMoverScore,
        isBestMove: !!bestUci && (bestUci === playedUci || bestUci.slice(0, 4) === playedUci.slice(0, 4)),
        playedMove: moveResult,
      });
      get()._recordQuality(q);
      get()._pushToast(q.key);

      // 4) Game over?
      if (game.isGameOver()) return get()._endGame();

      // 5) Engine replies.
      await get()._engineMove();
    } catch (err) {
      console.error('[pipeline] error', err);
      set({ thinking: false });
    }
  },

  async _engineMove() {
    set({ thinking: true });
    try {
      const fen = game.fen();
      const { bestmove } = await engine.chooseMove(fen, { skill: get().skill });
      if (bestmove) {
        const mv = uciToMove(bestmove);
        const res = game.move(mv);
        if (res) {
          set((st) => ({
            fen: game.fen(),
            lastMove: { from: res.from, to: res.to },
            history: buildHistory(st.history),
          }));
        }
      }
    } catch (err) {
      console.error('[engine] move error', err);
    } finally {
      set({ thinking: false });
    }

    if (game.isGameOver()) return get()._endGame();
    await get()._analyzeForTurn();
  },

  // Analyse the position when it is the player's turn: eval bar, plan baseline,
  // and coach-trigger evaluation.
  async _analyzeForTurn() {
    if (!get().engineReady) return;
    const fen = game.fen();
    const analysis = await analyzeWhite(fen, { depth: EVAL_DEPTH, multipv: 1 });

    set({ evalCp: analysis.white.cp ?? 0, evalMate: analysis.white.mate });

    // Cache the baseline for the upcoming player move's quality check.
    preMove = {
      fen,
      moverScore: { cp: analysis.top.cp, mate: analysis.top.mate },
      bestUci: analysis.top.move,
    };

    // Features + coaching decision (pure, cheap).
    const features = extractFeatures(fen, {
      lastMoveSan: lastSan(),
      inCheck: game.inCheck(),
    });
    const ply = game.history().length;
    const whiteCp = analysis.white.cp ?? 0;

    if (get().mode === 'coached') {
      const { trigger, reason } = evaluateTrigger({
        ply,
        lastCoachedPly,
        prevFeatures,
        features,
        prevEvalCp,
        evalCp: whiteCp,
        config: DEFAULT_TRIGGER_CONFIG,
      });
      if (trigger) {
        get().requestCoach({ reason });
      }
    }

    prevFeatures = features;
    prevEvalCp = whiteCp;
  },

  // ---------------------------------------------------------------------
  //  Coaching
  // ---------------------------------------------------------------------
  async requestCoach({ reason = 'periodic check-in', userQuestion = null } = {}) {
    if (!get().engineReady) return;
    if (coachAbort) coachAbort.abort('superseded');
    const controller = new AbortController();
    coachAbort = controller;

    // Safety net: never let the bubble spin forever if the LLM is slow or
    // unreachable (e.g. LM Studio not running).
    const timeout = setTimeout(() => controller.abort('timeout'), 60000);

    const fen = game.fen();
    lastCoachedPly = game.history().length;

    set((st) => ({
      coach: { ...st.coach, open: true, streaming: true, text: '', error: null, reason },
    }));

    try {
      // Richer analysis for the coach (top 3 lines).
      const analysis = await analyzeWhite(fen, { depth: COACH_DEPTH, multipv: COACH_MULTIPV });
      const lines = analysis.lines.map((l, i) => ({
        rank: i + 1,
        moveSan: pvToSan(fen, l.pv, 1)[0] || (l.move ? l.move : '—'),
        evalText: formatEval(toWhiteScore(fen, { cp: l.cp, mate: l.mate })),
        pvSan: pvToSan(fen, l.pv, 6),
      }));

      // Plan arrows come straight from the engine's best line, so they are
      // inherently tactically validated (it IS the engine's chosen continuation).
      const arrows = pvToArrows(fen, analysis.top.pv, 3);
      set((st) => ({ coach: { ...st.coach, arrows } }));

      const features = extractFeatures(fen, {
        lastMoveSan: lastSan(),
        inCheck: game.inCheck(),
      });

      const payload = {
        features,
        engine: {
          evalText: formatEval(analysis.white),
          evalCp: analysis.white.cp,
          turn: sideToMove(fen) === 'w' ? 'white' : 'black',
          lines,
        },
        playerColor: get().playerColor === 'w' ? 'white' : 'black',
        reason,
        mode: userQuestion ? 'ask' : 'coached',
        userQuestion: userQuestion || '',
        history: game.history(),
        language: get().lang,
      };

      await streamCoach(
        payload,
        (chunk) => set((st) => ({ coach: { ...st.coach, text: st.coach.text + chunk } })),
        controller.signal
      );
      clearTimeout(timeout);
      set((st) => ({ coach: { ...st.coach, streaming: false } }));
    } catch (err) {
      clearTimeout(timeout);
      // Superseded by a newer request → stay quiet and let that one drive the UI.
      if (controller.signal.aborted && controller.signal.reason === 'superseded') return;
      console.error('[coach] request failed', err);
      const timedOut = controller.signal.reason === 'timeout';
      const dict = getDict(get().lang);
      set((st) => ({
        coach: {
          ...st.coach,
          streaming: false,
          error: timedOut ? dict.coachTimeout : dict.coachError,
        },
      }));
    }
  },

  askCoach(question) {
    const q = (question || '').trim();
    if (!q) return;
    get().requestCoach({ reason: 'the learner asked a question', userQuestion: q });
  },

  closeCoach() {
    set((st) => ({ coach: { ...st.coach, open: false } }));
  },

  // ---------------------------------------------------------------------
  //  Feedback helpers
  // ---------------------------------------------------------------------
  _recordQuality(q) {
    // annotate the last history entry
    const history = get().history.slice();
    if (history.length) history[history.length - 1] = { ...history[history.length - 1], quality: q.key };

    set((st) => ({
      history,
      stats: {
        ...st.stats,
        playerMoves: st.stats.playerMoves + 1,
        [q.key]: (st.stats[q.key] || 0) + 1,
        winLossSum: st.stats.winLossSum + q.winLoss,
        cpLossSum: st.stats.cpLossSum + q.cpLoss,
      },
    }));
  },

  _pushToast(key) {
    // Move-quality badges show in every mode (including "silent") — the plan
    // defines silent as "no coaching interruptions, but keep the badges".
    const id = ++toastSeq;
    set((st) => ({ toasts: [...st.toasts, { id, key }] }));
    setTimeout(() => {
      set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }));
    }, 2200);
  },

  stats: START_STATS(),

  // ---------------------------------------------------------------------
  //  End of game
  // ---------------------------------------------------------------------
  resign() {
    if (get().status !== 'playing') return;
    set({
      status: 'over',
      result: { outcome: 'loss', reason: 'resign' },
    });
    get()._computeSuggestion();
  },

  _endGame() {
    let outcome = 'draw';
    let reason = 'draw';
    if (game.isCheckmate()) {
      reason = 'checkmate';
      // side to move is checkmated → the OTHER side won
      const loserIsPlayer = game.turn() === get().playerColor;
      outcome = loserIsPlayer ? 'loss' : 'win';
    } else if (game.isStalemate()) {
      reason = 'stalemate';
    } else if (game.isDraw()) {
      reason = 'draw';
    }
    set({ status: 'over', result: { outcome, reason }, thinking: false });
    get()._computeSuggestion();
  },

  _computeSuggestion() {
    const s = get().stats;
    const moves = s.playerMoves || 1;
    const badRate = (s.blunder + s.mistake) / moves;
    let suggestion = null;
    if (badRate > 0.25 && get().skill > 0) suggestion = 'down';
    else if (badRate < 0.08 && s.playerMoves >= 8 && get().skill < 20) suggestion = 'up';
    set({ suggestion });
  },

  applySuggestion() {
    const s = get();
    if (s.suggestion === 'up') get().setSkill(Math.min(20, s.skill + 3));
    else if (s.suggestion === 'down') get().setSkill(Math.max(0, s.skill - 3));
    set({ suggestion: null });
  },

  dismissSuggestion() {
    set({ suggestion: null });
  },
}));

// --- small pure helpers over the module-scoped `game` ---

function negate(v) {
  return v == null ? null : -v;
}

function lastSan() {
  const h = game.history();
  return h.length ? h[h.length - 1] : null;
}

function buildHistory(prev = []) {
  // Rebuild a lightweight, reactive history from chess.js verbose history,
  // preserving any quality annotations we already stored by index (moves only
  // ever append, so indices are stable).
  const verbose = game.history({ verbose: true });
  return verbose.map((m, i) => ({
    san: m.san,
    from: m.from,
    to: m.to,
    color: m.color,
    quality: prev[i]?.quality,
  }));
}
