import { parseInfoLine, parseBestMove, normaliseScore } from './uci.js';

/**
 * Thin, promise-based wrapper around a Stockfish Web Worker speaking UCI.
 *
 * Stockfish can only run one search at a time, so every request is serialised
 * through an internal FIFO queue. Two request kinds are exposed:
 *
 *   - analyze()    : full-strength (Skill 20) evaluation for the eval bar,
 *                    move-quality detection and the coach. Supports MultiPV.
 *   - chooseMove() : the opponent's reply, played at the user's chosen Skill
 *                    Level so difficulty is tunable.
 *
 * Skill Level is (re)applied at the start of each job — safe because jobs never
 * overlap — so analysis stays accurate no matter how weak the opponent is.
 */
export class StockfishEngine {
  constructor(enginePath = '/stockfish/stockfish.js') {
    this.enginePath = enginePath;
    this.worker = null;
    this.ready = false;
    this._handlers = new Set();
    this._queue = [];
    this._busy = false;
    this._initPromise = null;
  }

  init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = new Promise((resolve, reject) => {
      let worker;
      try {
        worker = new Worker(this.enginePath);
      } catch (err) {
        reject(err);
        return;
      }
      this.worker = worker;

      worker.onerror = (e) => {
        // Surface load/runtime failures instead of hanging forever.
        console.error('[stockfish] worker error:', e.message || e);
        if (!this.ready) reject(new Error(e.message || 'Stockfish worker failed to load'));
      };

      worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : (e.data && e.data.data) || '';
        if (line) this._dispatch(line);
      };

      const handshake = (line) => {
        if (line === 'uciok') {
          this._send('isready');
        } else if (line === 'readyok') {
          this.ready = true;
          this._handlers.delete(handshake);
          resolve(this);
          this._pump();
        }
      };
      this._handlers.add(handshake);
      this._send('uci');
    });
    return this._initPromise;
  }

  _send(cmd) {
    if (this.worker) this.worker.postMessage(cmd);
  }

  _dispatch(line) {
    // Copy to avoid mutation-during-iteration when a handler removes itself.
    for (const h of [...this._handlers]) h(line);
  }

  _enqueue(runFn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ runFn, resolve, reject, finished: false });
      this._pump();
    });
  }

  _pump() {
    if (this._busy || !this.ready || this._queue.length === 0) return;
    this._busy = true;
    const job = this._queue.shift();
    const finish = (value, err) => {
      if (job.finished) return;
      job.finished = true;
      this._busy = false;
      if (err) job.reject(err);
      else job.resolve(value);
      this._pump();
    };
    try {
      job.runFn(
        (v) => finish(v, null),
        (e) => finish(null, e)
      );
    } catch (err) {
      finish(null, err);
    }
  }

  /**
   * Analyse a position at full strength.
   * @param {string} fen
   * @param {{multipv?:number, depth?:number, movetime?:number}} [opts]
   * @returns {Promise<{bestmove:string|null, depth:number, lines:Array}>}
   */
  analyze(fen, opts = {}) {
    const { multipv = 1, depth = 15, movetime = null } = opts;
    return this._enqueue((resolve) => {
      const linesByPv = new Map();
      let maxDepth = 0;
      const handler = (line) => {
        const info = parseInfoLine(line);
        if (info) {
          linesByPv.set(info.multipv, info);
          if (info.depth > maxDepth) maxDepth = info.depth;
          return;
        }
        const bm = parseBestMove(line);
        if (bm) {
          this._handlers.delete(handler);
          const lines = [...linesByPv.values()]
            .sort((a, b) => a.multipv - b.multipv)
            .map((i) => ({
              multipv: i.multipv,
              depth: i.depth,
              pv: i.pv,
              move: i.pv[0] || null,
              rawScore: i.score,
              ...normaliseScore(i.score),
            }));
          resolve({ bestmove: bm.bestmove, depth: maxDepth, lines });
        }
      };
      this._handlers.add(handler);
      // Always analyse at full strength regardless of opponent difficulty.
      this._send('setoption name Skill Level value 20');
      this._send('setoption name UCI_LimitStrength value false');
      this._send(`setoption name MultiPV value ${Math.max(1, multipv)}`);
      this._send('ucinewgame');
      this._send(`position fen ${fen}`);
      if (movetime) this._send(`go movetime ${movetime}`);
      else this._send(`go depth ${depth}`);
    });
  }

  /**
   * Pick the opponent's move at a given Skill Level (0-20). Lower levels also
   * search shallower, which makes weak play feel more natural and stay fast.
   * @param {string} fen
   * @param {{skill?:number, movetime?:number}} [opts]
   * @returns {Promise<{bestmove:string|null, ponder:string|null}>}
   */
  chooseMove(fen, opts = {}) {
    const skill = Math.max(0, Math.min(20, opts.skill ?? 8));
    const movetime = opts.movetime ?? Math.round(120 + skill * 45); // 120ms..1020ms
    const depthCap = Math.round(4 + skill * 0.9); // ~4..22 plies
    return this._enqueue((resolve) => {
      let ponder = null;
      const handler = (line) => {
        const info = parseInfoLine(line);
        if (info && info.pv.length > 1) ponder = info.pv[1];
        const bm = parseBestMove(line);
        if (bm) {
          this._handlers.delete(handler);
          resolve({ bestmove: bm.bestmove, ponder: bm.ponder || ponder });
        }
      };
      this._handlers.add(handler);
      this._send('setoption name MultiPV value 1');
      this._send('setoption name Skill Level value ' + skill);
      this._send('ucinewgame');
      this._send(`position fen ${fen}`);
      // Bound BOTH time and depth so weak levels reply quickly.
      this._send(`go movetime ${movetime} depth ${depthCap}`);
    });
  }

  /** Ask the engine to stop the current search early (best effort). */
  stop() {
    this._send('stop');
  }

  /** Terminate the worker. */
  destroy() {
    try {
      this._send('quit');
      this.worker && this.worker.terminate();
    } catch {
      /* ignore */
    }
    this.worker = null;
    this.ready = false;
    this._handlers.clear();
    this._queue = [];
    this._busy = false;
    this._initPromise = null;
  }
}

// App-wide singleton — one engine shared by the whole session.
let singleton = null;
export function getEngine() {
  if (!singleton) singleton = new StockfishEngine();
  return singleton;
}
