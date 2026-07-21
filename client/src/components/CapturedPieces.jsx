import { useGameStore } from '../store/gameStore.js';
import { materialSummary } from '../lib/chessUtils.js';

const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
const ORDER = ['q', 'r', 'b', 'n', 'p'];

// A tray of the pieces one side has captured, plus a "+N" material-advantage
// badge. `edge` selects whether this is the opponent's tray (top) or yours
// (bottom); orientation follows the player's colour.
export default function CapturedPieces({ edge }) {
  const fen = useGameStore((s) => s.fen);
  const playerColor = useGameStore((s) => s.playerColor);
  const { whiteCapturedByBlack, blackCapturedByWhite, diff } = materialSummary(fen);

  // Whose tray is this, and what did they capture?
  const isPlayer = edge === 'bottom';
  const playerIsWhite = playerColor === 'w';
  const showsWhite = isPlayer ? !playerIsWhite : playerIsWhite; // which colour of pieces sit here

  const captured = showsWhite ? whiteCapturedByBlack : blackCapturedByWhite;
  // Material advantage from this tray-owner's point of view.
  const ownerAdvantage = isPlayer ? (playerIsWhite ? diff : -diff) : playerIsWhite ? -diff : diff;

  const glyphTone = showsWhite ? 'text-slate-100' : 'text-slate-500';

  const pieces = ORDER.flatMap((t) => Array.from({ length: captured[t] || 0 }, (_, i) => `${t}${i}`));

  return (
    <div className="flex h-6 items-center gap-1 px-1 text-lg leading-none">
      <span className={`flex items-center ${glyphTone}`}>
        {pieces.map((key) => (
          <span key={key} className="-mr-1.5 drop-shadow-sm">
            {GLYPH[key[0]]}
          </span>
        ))}
      </span>
      {ownerAdvantage > 0 && (
        <span className="fa-num ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-bold text-emerald-300">
          +{ownerAdvantage}
        </span>
      )}
    </div>
  );
}
