import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import { QUALITY } from '../lib/i18n.js';

// Scrollable move history in paired rows. The player's moves carry the little
// quality emoji so the log doubles as a review. Auto-scrolls to the latest.
export default function MoveList() {
  const history = useGameStore((s) => s.history);
  const { t } = useI18n();
  const scroller = useRef(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [history.length]);

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="panel flex h-full flex-col p-3">
      <div className="panel-label px-1">{t.movesTitle}</div>
      <div ref={scroller} className="thin-scroll flex-1 overflow-y-auto pr-1" dir="ltr">
        {rows.length === 0 ? (
          <p className="px-2 pt-2 text-xs text-slate-500">{t.noMovesYet}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.n} className="rounded odd:bg-white/[0.03]">
                  <td className="fa-num w-8 py-1 pl-2 text-xs text-slate-500">{r.n}.</td>
                  <MoveCell move={r.white} t={t} />
                  <MoveCell move={r.black} t={t} />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MoveCell({ move, t }) {
  if (!move) return <td className="py-1" />;
  const q = move.quality ? QUALITY[move.quality] : null;
  return (
    <td className="py-1 pr-2 font-semibold text-slate-200">
      <span className="inline-flex items-center gap-1">
        {move.san}
        {q && <span title={t.moveQuality[move.quality]}>{q.emoji}</span>}
      </span>
    </td>
  );
}
