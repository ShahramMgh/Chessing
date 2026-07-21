// Text-to-speech for the coach, using the browser's built-in Web Speech API
// (window.speechSynthesis). This is genuinely free, needs no API key or online
// service, works offline, and supports many languages via the OS voices.
//
// (An online engine like Edge/Bing TTS would give higher-quality voices but
// requires an unofficial proxy + network; the built-in synth is the robust,
// keyless default. The `lang` -> BCP-47 mapping below is where you'd swap it.)

const BCP47 = { en: 'en-US', fr: 'fr-FR', fa: 'fa-IR' };

let voices = [];
function refreshVoices() {
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    voices = [];
  }
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function speechSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

function pickVoice(lang) {
  const target = BCP47[lang] || 'en-US';
  const list = voices.length ? voices : (() => { refreshVoices(); return voices; })();
  return (
    list.find((v) => v.lang === target) ||
    list.find((v) => v.lang && v.lang.toLowerCase().startsWith(lang)) ||
    null
  );
}

/**
 * Speak the given text in the given UI language. Cancels any current speech.
 * @param {string} text
 * @param {'en'|'fr'|'fa'} lang
 */
export function speak(text, lang) {
  if (!speechSupported() || !text) return;
  const synth = window.speechSynthesis;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang] || 'en-US';
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = 1;
    u.pitch = 1;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
