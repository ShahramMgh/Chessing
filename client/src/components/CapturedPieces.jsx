import { useGameStore } from '../store/gameStore.js';
import { materialSummary } from '../lib/chessUtils.js';

const GLYPH = { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const ORDER = ['q', 'r', 'b', 'n', 'p'];

// Solid, distinctly-toned fills so BOTH colours read clearly on the dark tray:
// white-lost pieces are bright, black-lost pieces are a clear gray silhouette.
function glyphStyle(isWhite) {
  return isWhite
    ? { color: '#f8fafc', WebkitTextStroke: '0.5px rgba(15,23,42,0.5)' }
    : { color: '#7c8aa5', WebkitTextStroke: '0.5px rgba(226,232,240,0.5)' };
}

// Shows the pieces a given side has LOST, grouped by type, next to that side —
// so near "You" you see your own captured pieces. A "+N" badge marks whichever
// side is ahead on material.
export default function CapturedPieces({ edge }) {
  const fen = useGameStore((s) => s.fen);
  const playerColor = useGameStore((s) => s.playerColor);
  const { whiteCapturedByBlack, blackCapturedByWhite, diff } = materialSummary(fen);

  const isPlayer = edge === 'bottom';
  const playerIsWhite = playerColor === 'w';
  // This tray belongs to the player (bottom) or the opponent (top); show THAT
  // side's own lost pieces.
  const ownerIsWhite = isPlayer ? playerIsWhite : !playerIsWhite;
  const lost = ownerIsWhite ? whiteCapturedByBlack : blackCapturedByWhite;
  const ownerAdvantage = ownerIsWhite ? diff : -diff;

  const style = glyphStyle(ownerIsWhite);
  const anyLost = ORDER.some((t) => (lost[t] || 0) > 0);

  return (
    <div className="flex h-7 items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-lg bg-black/20 px-1.5 py-0.5 ring-1 ring-white/5">
        {!anyLost && <span className="px-0.5 text-xs text-slate-600">—</span>}
        {ORDER.map((t) => {
          const n = lost[t] || 0;
          if (!n) return null;
          return (
            <span key={t} className="flex items-center">
              {Array.from({ length: n }).map((_, i) => (
                <span key={i} className="-mr-[3px] text-[19px] leading-none" style={style}>
                  {GLYPH[t]}
                </span>
              ))}
            </span>
          );
        })}
      </div>
      {ownerAdvantage > 0 && (
        <span className="fa-num rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
          +{ownerAdvantage}
        </span>
      )}
    </div>
  );
}
