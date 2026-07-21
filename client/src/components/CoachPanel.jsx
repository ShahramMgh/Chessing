import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import AskCoach from './AskCoach.jsx';

// Master Kian — the coach avatar + speech bubble. Streams the explanation
// token-by-token and shows the "plan" chip when board arrows are active.
export default function CoachPanel() {
  const coach = useGameStore((s) => s.coach);
  const mode = useGameStore((s) => s.mode);
  const started = useGameStore((s) => s.started);
  const { t } = useI18n();

  const bubbleText = coach.text || (mode === 'silent' ? '' : t.coachIntro);

  return (
    <div className="panel flex h-full flex-col p-4">
      {/* header */}
      <div className="mb-3 flex items-center gap-3">
        <Avatar speaking={coach.streaming} />
        <div className="min-w-0">
          <div className="font-extrabold text-slate-100">{t.coachName}</div>
          <div className="text-xs text-slate-400">
            {coach.streaming ? (
              <span className="inline-flex items-center gap-1 text-indigo-300">
                <TypingDots /> {t.coachThinking}
              </span>
            ) : (
              t.coachTagline
            )}
          </div>
        </div>
      </div>

      {/* speech bubble */}
      <div className="relative flex-1">
        <div className="absolute -top-2 h-4 w-4 rotate-45 rounded-sm bg-ink-900/90 ring-1 ring-white/10 ltr:left-5 rtl:right-5" />
        <div className="animate-bubble-pop relative h-full overflow-y-auto thin-scroll rounded-2xl bg-ink-900/90 p-4 text-[15px] leading-[1.9] text-slate-100 ring-1 ring-white/10">
          {mode === 'silent' && !coach.text ? (
            <p className="text-slate-400">{t.silentModeMessage}</p>
          ) : coach.error ? (
            <p className="text-red-300">{coach.error}</p>
          ) : (
            <p className="whitespace-pre-wrap">
              {bubbleText}
              {coach.streaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink rounded-sm bg-indigo-300" />
              )}
            </p>
          )}

          {coach.arrows?.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200 ring-1 ring-indigo-400/20">
              <span>🎯</span>
              <span>{t.planChip}</span>
            </div>
          )}
        </div>
      </div>

      {/* on-demand chat (coached & ask modes) */}
      {started && mode !== 'silent' && (
        <div className="mt-3">
          <AskCoach />
        </div>
      )}
    </div>
  );
}

function Avatar({ speaking }) {
  return (
    <div className="relative shrink-0">
      {speaking && (
        <span className="absolute inset-0 -m-1 animate-glow-pulse rounded-full bg-indigo-500/40 blur-md" />
      )}
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-600 text-2xl shadow-lg ${
          speaking ? 'ring-2 ring-indigo-300/70' : 'ring-1 ring-white/20'
        }`}
      >
        <span aria-hidden>♞</span>
      </div>
      <span
        className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-800 ${
          speaking ? 'bg-emerald-400' : 'bg-slate-500'
        }`}
      />
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-blink rounded-full bg-indigo-300"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
