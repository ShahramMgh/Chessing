import { useGameStore } from '../store/gameStore.js';

// A clean, urgent warning shown over the top of the board when the opponent has
// a real tactical threat (paired with the red arrow + endangered-square glow).
export default function ThreatBanner() {
  const threat = useGameStore((s) => s.threat);
  if (!threat) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3">
      <div className="animate-toast-in flex items-center gap-2 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgba(239,68,68,0.7)] ring-1 ring-white/25">
        <span className="text-base drop-shadow">⚠️</span>
        <span>{threat.message}</span>
      </div>
    </div>
  );
}
