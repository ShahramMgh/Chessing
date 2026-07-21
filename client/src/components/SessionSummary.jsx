import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import { QUALITY, takeawayKey } from '../lib/i18n.js';

// End-of-game overlay: result, an accuracy ring, a breakdown of move quality,
// an encouraging takeaway, and the adaptive difficulty suggestion.
export default function SessionSummary() {
  const status = useGameStore((s) => s.status);
  const result = useGameStore((s) => s.result);
  const stats = useGameStore((s) => s.stats);
  const suggestion = useGameStore((s) => s.suggestion);
  const applySuggestion = useGameStore((s) => s.applySuggestion);
  const dismissSuggestion = useGameStore((s) => s.dismissSuggestion);
  const newGame = useGameStore((s) => s.newGame);
  const playerColor = useGameStore((s) => s.playerColor);
  const skill = useGameStore((s) => s.skill);
  const { t } = useI18n();
  const [closed, setClosed] = useState(false);

  if (status !== 'over' || closed) return null;

  const moves = stats.playerMoves || 0;
  const accuracy = moves ? Math.max(0, Math.round(100 - stats.winLossSum / moves)) : 0;
  const avgLoss = moves ? Math.round(stats.cpLossSum / moves) : 0;

  const win = result?.outcome === 'win';
  const loss = result?.outcome === 'loss';
  const title = win ? t.youWin : loss ? t.youLose : t.drawResult;
  const reason =
    result?.reason === 'checkmate'
      ? t.checkmate
      : result?.reason === 'stalemate'
        ? t.stalemate
        : result?.reason === 'resign'
          ? t.resign
          : t.draw;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-lg rounded-3xl bg-ink-800 p-6 shadow-card ring-1 ring-white/10">
        <div
          className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
            win ? 'bg-emerald-500/20' : loss ? 'bg-red-500/15' : 'bg-slate-500/20'
          }`}
        >
          {win ? '🏆' : '🤝'}
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-100">{title}</h2>
        <p className="mb-5 mt-1 text-center text-sm text-slate-400">{reason}</p>

        {/* accuracy ring + avg loss */}
        <div className="mb-5 flex items-center justify-center gap-8">
          <AccuracyRing value={accuracy} label={t.stats.accuracy} />
          <div className="text-center">
            <div className="fa-num text-3xl font-extrabold text-slate-100">{avgLoss}</div>
            <div className="mt-1 max-w-[130px] text-xs text-slate-400">{t.stats.avgLoss}</div>
          </div>
        </div>

        {/* quality breakdown */}
        <div className="mb-5 grid grid-cols-5 gap-2">
          {['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder'].map((k) => (
            <div key={k} className="rounded-xl bg-black/30 p-2 text-center ring-1 ring-white/5">
              <div className="text-lg">{QUALITY[k].emoji}</div>
              <div className="fa-num text-lg font-bold text-slate-100">{stats[k] || 0}</div>
              <div className="text-[10px] text-slate-500">{t.stats[k]}</div>
            </div>
          ))}
        </div>

        <p className="mb-5 rounded-xl bg-black/30 p-3 text-center text-sm text-slate-300 ring-1 ring-white/5">
          {t.takeaways[takeawayKey(stats, accuracy)]}
        </p>

        {suggestion && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-indigo-500/15 p-3 text-sm text-indigo-100 ring-1 ring-indigo-400/20">
            <span>{suggestion === 'up' ? t.difficultyUp : t.difficultyDown}</span>
            <div className="flex shrink-0 gap-2">
              <button onClick={applySuggestion} className="btn-brand px-3 py-1.5 text-xs">
                {suggestion === 'up' ? t.raise : t.lower}
              </button>
              <button onClick={dismissSuggestion} className="btn-ghost px-3 py-1.5 text-xs">
                {t.dismiss}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setClosed(false);
              newGame({ playerColor, skill });
            }}
            className="btn-primary flex-1 py-3"
          >
            {t.playAgain}
          </button>
          <button onClick={() => setClosed(true)} className="btn-ghost py-3">
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccuracyRing({ value, label }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  const tone = value >= 80 ? '#34d399' : value >= 55 ? '#818cf8' : '#fbbf24';
  return (
    <div className="relative h-[92px] w-[92px]">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="fa-num text-2xl font-extrabold text-slate-100">{value}%</span>
        <span className="text-[10px] text-slate-400">{label}</span>
      </div>
    </div>
  );
}
