import { useGameStore } from '../store/gameStore.js';
import { LANGS, LANG_META } from '../lib/i18n.js';

// Compact 3-way language switch (EN / FR / فا) shown in the header.
export default function LanguageToggle() {
  const lang = useGameStore((s) => s.lang);
  const setLang = useGameStore((s) => s.setLang);

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-ink-800/70 p-0.5 ring-1 ring-white/10 backdrop-blur">
      {LANGS.map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          title={LANG_META[code].name}
          className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
            lang === code
              ? 'bg-gradient-to-b from-indigo-400 to-indigo-500 text-white shadow'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          {LANG_META[code].label}
        </button>
      ))}
    </div>
  );
}
