import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import { speechSupported } from '../lib/speech.js';

// A compact action bar under the board: take back a move, ask for a hint, and
// toggle move sounds / the coach's spoken voice.
export default function BoardToolbar() {
  const status = useGameStore((s) => s.status);
  const thinking = useGameStore((s) => s.thinking);
  const engineReady = useGameStore((s) => s.engineReady);
  const playerColor = useGameStore((s) => s.playerColor);
  const fen = useGameStore((s) => s.fen);
  const historyLen = useGameStore((s) => s.history.length);
  const soundOn = useGameStore((s) => s.soundOn);
  const voiceOn = useGameStore((s) => s.voiceOn);
  const takeback = useGameStore((s) => s.takeback);
  const hint = useGameStore((s) => s.hint);
  const setSoundOn = useGameStore((s) => s.setSoundOn);
  const setVoiceOn = useGameStore((s) => s.setVoiceOn);
  const { t } = useI18n();

  const yourTurn = status === 'playing' && !thinking && fen.split(' ')[1] === playerColor;
  const canUndo = status === 'playing' && !thinking && historyLen >= 2;

  return (
    <div
      className="mx-auto flex w-fit items-center gap-1 rounded-2xl bg-ink-800/70 p-1 ring-1 ring-white/10 backdrop-blur"
      dir="ltr"
    >
      <Btn onClick={takeback} disabled={!canUndo} icon="↩︎" label={t.undo} />
      <Btn onClick={hint} disabled={!yourTurn || !engineReady} icon="💡" label={t.hint} tone="accent" />
      <span className="mx-0.5 h-5 w-px bg-white/10" />
      <Btn on={soundOn} onClick={() => setSoundOn(!soundOn)} icon={soundOn ? '🔊' : '🔇'} label={t.sound} tone="toggle" />
      {speechSupported() && (
        <Btn
          on={voiceOn}
          onClick={() => setVoiceOn(!voiceOn)}
          icon={voiceOn ? '🗣️' : '🔈'}
          label={t.voice}
          tone="toggle"
        />
      )}
    </div>
  );
}

function Btn({ onClick, disabled, icon, label, tone, on }) {
  let cls = 'text-slate-200 hover:bg-white/[0.07]';
  if (tone === 'accent') cls = 'text-emerald-200 hover:bg-emerald-500/15';
  else if (tone === 'toggle')
    cls = on ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:bg-white/[0.07]';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-pressed={tone === 'toggle' ? on : undefined}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:translate-y-px disabled:opacity-35 ${cls}`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  );
}
