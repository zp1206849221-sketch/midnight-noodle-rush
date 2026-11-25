// audio.js — every sound is a little oscillator bleep synthesised live with
// the WebAudio API. No audio files, nothing to load, works fully offline.

let ctx = null;
let muted = false;

export function toggleMute() {
  muted = !muted;
  return muted;
}

// The context can only start after a user gesture, so it is created lazily
// from the first click or keypress and quietly does nothing before that.
function ensureCtx() {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, startIn, dur, type = 'sine', gainPeak = 0.12) {
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + startIn;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click() {
    tone(660, 0, 0.07, 'triangle', 0.08);
  },
  pop() {
    tone(420, 0, 0.06, 'sine', 0.1);
    tone(760, 0.03, 0.08, 'sine', 0.09);
  },
  pour() {
    tone(300, 0, 0.16, 'sine', 0.07);
    tone(240, 0.08, 0.16, 'sine', 0.06);
  },
  ding() {
    tone(1180, 0, 0.22, 'sine', 0.12);
    tone(1560, 0.02, 0.3, 'sine', 0.08);
  },
  serve() {
    tone(660, 0, 0.1, 'triangle', 0.1);
    tone(880, 0.08, 0.1, 'triangle', 0.1);
    tone(1320, 0.16, 0.2, 'triangle', 0.11);
  },
  error() {
    tone(160, 0, 0.18, 'sawtooth', 0.06);
  },
  trash() {
    tone(220, 0, 0.1, 'square', 0.05);
    tone(120, 0.07, 0.16, 'square', 0.05);
  },
  lose() {
    tone(520, 0, 0.14, 'triangle', 0.09);
    tone(340, 0.12, 0.24, 'triangle', 0.09);
  },
};
