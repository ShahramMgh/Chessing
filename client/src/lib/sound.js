// Tiny synthesized sound effects via the Web Audio API — no asset files needed.
// The AudioContext is created lazily on first use; since the first sound is
// always triggered by a user gesture (a move), autoplay policies are satisfied.

let ctx = null;

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// A short enveloped tone (optionally gliding from freq -> freq2).
function blip({ freq = 320, freq2, dur = 0.08, type = 'triangle', gain = 0.12, delay = 0 }) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

export const sfx = {
  move: () => blip({ freq: 300, freq2: 190, dur: 0.075, type: 'triangle', gain: 0.11 }),
  capture: () => {
    blip({ freq: 210, freq2: 90, dur: 0.11, type: 'sawtooth', gain: 0.13 });
    blip({ freq: 150, freq2: 70, dur: 0.13, type: 'triangle', gain: 0.08, delay: 0.02 });
  },
  check: () => blip({ freq: 720, freq2: 940, dur: 0.12, type: 'square', gain: 0.09 }),
  hint: () => blip({ freq: 620, freq2: 820, dur: 0.1, type: 'sine', gain: 0.09 }),
  gameEnd: () => {
    blip({ freq: 523, dur: 0.16, type: 'sine', gain: 0.12 });
    blip({ freq: 392, dur: 0.22, type: 'sine', gain: 0.12, delay: 0.14 });
    blip({ freq: 659, dur: 0.26, type: 'sine', gain: 0.11, delay: 0.3 });
  },
};
