import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import { formatEval } from '../lib/i18n.js';

// Vertical eval bar (White at the bottom). The white fill height animates
// smoothly as the evaluation shifts, giving the "living" feel from the brief.
export default function EvalBar() {
  const evalCp = useGameStore((s) => s.evalCp);
  const evalMate = useGameStore((s) => s.evalMate);
  const playerColor = useGameStore((s) => s.playerColor);
  const { t } = useI18n();

  let whitePct;
  if (evalMate != null) {
    whitePct = evalMate > 0 ? 100 : 0;
  } else {
    const clamped = Math.max(-800, Math.min(800, evalCp || 0));
    whitePct = 50 + (clamped / 800) * 50;
  }

  const flip = playerColor === 'b';
  const label = formatEval({ cp: evalCp, mate: evalMate }, t);
  const whiteAhead = evalMate != null ? evalMate > 0 : (evalCp || 0) >= 0;

  return (
    <div className="flex h-full min-h-[320px] select-none flex-col items-center gap-2" dir="ltr">
      <div
        className="relative w-6 flex-1 overflow-hidden rounded-full bg-slate-950 shadow-inner ring-1 ring-white/10"
        style={{ transform: flip ? 'rotate(180deg)' : 'none' }}
        title={`${t.evalLabel}: ${label}`}
      >
        <div
          className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-slate-100 to-white transition-[height] duration-700 ease-out"
          style={{ height: `${whitePct}%` }}
        />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-indigo-400/40" />
      </div>
      <span
        className={`fa-num rounded-md px-2 py-0.5 text-xs font-bold shadow-sm ${
          whiteAhead ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-100 ring-1 ring-white/10'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
