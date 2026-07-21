import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import { skillLevelKey } from '../lib/i18n.js';

const MODES = ['coached', 'silent', 'ask'];

export default function ControlPanel() {
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);
  const skill = useGameStore((s) => s.skill);
  const setSkill = useGameStore((s) => s.setSkill);
  const newGame = useGameStore((s) => s.newGame);
  const resign = useGameStore((s) => s.resign);
  const status = useGameStore((s) => s.status);
  const playerColor = useGameStore((s) => s.playerColor);
  const { t } = useI18n();

  const [nextColor, setNextColor] = useState(playerColor);

  return (
    <div className="panel flex flex-col gap-5 p-4">
      {/* Mode */}
      <div>
        <div className="panel-label">{t.mode}</div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/25 p-1 ring-1 ring-white/5">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition ${
                mode === m
                  ? 'bg-gradient-to-b from-indigo-400 to-indigo-500 text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.7)]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {t.modes[m]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">{t.modeHints[mode]}</p>
      </div>

      {/* Difficulty */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="panel-label mb-0">{t.difficulty}</span>
          <span className="fa-num flex items-center gap-2 text-xs font-bold text-indigo-300">
            <span className="text-slate-400">{t.skillLevels[skillLevelKey(skill)]}</span>
            <span className="rounded-md bg-black/30 px-2 py-0.5">{skill}/20</span>
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          value={skill}
          onChange={(e) => setSkill(Number(e.target.value))}
          style={{ '--range-progress': `${(skill / 20) * 100}%` }}
          className="w-full"
          dir="ltr"
        />
      </div>

      {/* Play as */}
      <div>
        <div className="panel-label">{t.playAs}</div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/25 p-1 ring-1 ring-white/5">
          {[
            ['w', t.white, '♔'],
            ['b', t.black, '♚'],
          ].map(([c, label, glyph]) => (
            <button
              key={c}
              onClick={() => setNextColor(c)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition ${
                nextColor === c
                  ? c === 'w'
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-950 text-slate-100 ring-1 ring-white/20'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="text-base">{glyph}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => newGame({ playerColor: nextColor, skill })} className="btn-primary flex-1">
          {t.newGame}
        </button>
        <button onClick={resign} disabled={status !== 'playing'} className="btn-ghost">
          {t.resign}
        </button>
      </div>
    </div>
  );
}
