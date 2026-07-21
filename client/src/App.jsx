import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore.js';
import { useI18n } from './lib/useI18n.js';
import { fetchCoachHealth } from './api/coach.js';
import Board from './components/Board.jsx';
import EvalBar from './components/EvalBar.jsx';
import MoveToasts from './components/MoveToasts.jsx';
import CoachPanel from './components/CoachPanel.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import MoveList from './components/MoveList.jsx';
import CapturedPieces from './components/CapturedPieces.jsx';
import SessionSummary from './components/SessionSummary.jsx';
import LanguageToggle from './components/LanguageToggle.jsx';

export default function App() {
  const newGame = useGameStore((s) => s.newGame);
  const started = useGameStore((s) => s.started);
  const { t, dir, lang } = useI18n();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (!started) newGame({ playerColor: 'w', skill: 5 });
    fetchCoachHealth().then(setHealth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the document direction/language in sync with the chosen UI language.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6">
      <header className="mx-auto mb-6 flex max-w-[1360px] items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="animate-float flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-600 text-2xl shadow-glow">
            ♟️
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-xl font-extrabold text-transparent">
              {t.appTitle}
            </h1>
            <p className="text-xs text-slate-400">{t.headerSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CoachBadge health={health} t={t} />
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1360px] grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        {/* left: controls + moves */}
        <div className="flex flex-col gap-5">
          <ControlPanel />
          <div className="hidden h-72 lg:block">
            <MoveList />
          </div>
        </div>

        {/* center: board area — sized to fill the column but capped by the
            viewport height so a big board never forces vertical scrolling. */}
        <div className="flex flex-col items-center gap-4">
          <StatusBar />
          <div className="w-full" style={{ maxWidth: 'min(100%, calc(100vh - 210px))' }}>
            <div className="flex items-stretch gap-3" dir="ltr">
              <EvalBar />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <PlayerTag edge="top" t={t} />
                <div className="relative">
                  <MoveToasts />
                  <Board />
                </div>
                <PlayerTag edge="bottom" t={t} />
              </div>
            </div>
          </div>
        </div>

        {/* right: coach */}
        <div className="h-[540px] lg:h-auto lg:min-h-[560px]">
          <CoachPanel />
        </div>

        {/* moves on small screens */}
        <div className="h-56 lg:hidden">
          <MoveList />
        </div>
      </main>

      <SessionSummary />
    </div>
  );
}

// A small tag on either edge of the board naming the side and showing captures.
function PlayerTag({ edge, t }) {
  const playerColor = useGameStore((s) => s.playerColor);
  const skill = useGameStore((s) => s.skill);
  const isPlayer = edge === 'bottom';
  const name = isPlayer ? t.player : t.opponent;
  const sub = isPlayer ? '' : `${t.level} ${skill}`;
  const glyph = isPlayer ? (playerColor === 'w' ? '♙' : '♟') : playerColor === 'w' ? '♟' : '♙';

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-lg ring-1 ring-white/10">
          {glyph}
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-100">{name}</div>
          {sub && <div className="fa-num text-[11px] text-slate-500">{sub}</div>}
        </div>
      </div>
      <div dir="ltr">
        <CapturedPieces edge={edge} />
      </div>
    </div>
  );
}

function CoachBadge({ health, t }) {
  if (!health) return null;
  const on = health.coachEnabled;
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 backdrop-blur ${
        on
          ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
          : 'bg-amber-500/10 text-amber-300 ring-amber-500/30'
      }`}
      title={health.model || ''}
    >
      <span className={`h-2 w-2 rounded-full ${on ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'}`} />
      {on ? t.coachActive : t.coachInactive}
    </div>
  );
}
