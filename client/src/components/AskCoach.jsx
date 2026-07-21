import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';

// On-demand chat: the player types a question and it is sent to /api/coach with
// the current position context.
export default function AskCoach() {
  const [q, setQ] = useState('');
  const askCoach = useGameStore((s) => s.askCoach);
  const streaming = useGameStore((s) => s.coach.streaming);
  const engineReady = useGameStore((s) => s.engineReady);
  const { t } = useI18n();

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim() || streaming) return;
    askCoach(q);
    setQ('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.askPlaceholder}
        disabled={!engineReady}
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-indigo-400/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
      <button type="submit" disabled={streaming || !q.trim()} className="btn-brand shrink-0 px-4">
        {t.send}
      </button>
    </form>
  );
}
