import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';

// Compact status strip: whose turn it is, whether the engine is thinking, and
// whether the engine is still loading.
export default function StatusBar() {
  const status = useGameStore((s) => s.status);
  const thinking = useGameStore((s) => s.thinking);
  const engineReady = useGameStore((s) => s.engineReady);
  const engineError = useGameStore((s) => s.engineError);
  const playerColor = useGameStore((s) => s.playerColor);
  const fen = useGameStore((s) => s.fen);
  const { t } = useI18n();

  const turn = fen.split(' ')[1];
  const yourTurn = turn === playerColor && status === 'playing';

  let text;
  if (!engineReady && !engineError) text = t.engineLoading;
  else if (engineError) text = t.engineError;
  else if (status === 'over') text = t.gameOver;
  else if (thinking) text = t.thinking;
  else text = yourTurn ? t.yourTurn : t.engineTurn;

  const loading = !engineReady && !engineError;
  const dot =
    loading || thinking
      ? 'bg-amber-400 animate-pulse'
      : engineError
        ? 'bg-red-400'
        : yourTurn
          ? 'bg-emerald-400'
          : 'bg-slate-500';

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full bg-ink-800/70 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10 backdrop-blur">
      <span
        className={`h-2.5 w-2.5 rounded-full ${dot} ${
          yourTurn && !thinking ? 'shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]' : ''
        }`}
      />
      <span>{text}</span>
    </div>
  );
}
