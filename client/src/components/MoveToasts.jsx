import { useGameStore } from '../store/gameStore.js';
import { useI18n } from '../lib/useI18n.js';
import { QUALITY } from '../lib/i18n.js';

// Animated badges that pop up on each player move ("✨ Brilliant!",
// "💥 Blunder!") and fade away. Stacked top-center over the board.
export default function MoveToasts() {
  const toasts = useGameStore((s) => s.toasts);
  const { t } = useI18n();

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((item) => {
        const q = QUALITY[item.key] || QUALITY.good;
        return (
          <div
            key={item.id}
            className="animate-toast-in flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold text-white shadow-toast ring-1 ring-white/20"
            style={{
              background: `linear-gradient(135deg, ${q.color}, ${shade(q.color)})`,
              boxShadow: `0 10px 28px -8px ${q.color}aa`,
            }}
          >
            <span className="text-base drop-shadow">{q.emoji}</span>
            <span>{t.moveQuality[item.key]}</span>
          </div>
        );
      })}
    </div>
  );
}

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
