import { useGameStore } from '../store/gameStore.js';
import { getDict, LANG_META } from './i18n.js';

// Subscribe a component to the current language and return its dictionary +
// direction. `t` is the full dictionary object (e.g. t.newGame, t.stats.good).
export function useI18n() {
  const lang = useGameStore((s) => s.lang);
  return { lang, t: getDict(lang), dir: LANG_META[lang]?.dir || 'ltr', meta: LANG_META[lang] };
}
