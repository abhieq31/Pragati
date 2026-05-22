/**
 * Tiny sound effects using the Web Audio API — no asset files needed.
 * Calls are no-ops on the server and gracefully no-op if the browser
 * blocks audio (e.g. user hasn't interacted yet).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch { return null; }
}

/** Soft two-tone chime — for task / project completion. */
export function playSuccessChime() {
  const c = getCtx();
  if (!c) return;
  try {
    // Resume if suspended (autoplay policy)
    if (c.state === 'suspended') c.resume();

    const now = c.currentTime;
    const notes = [
      { freq: 660, start: 0,    dur: 0.12 }, // E5
      { freq: 880, start: 0.10, dur: 0.18 }, // A5
    ];
    for (const n of notes) {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0, now + n.start);
      gain.gain.linearRampToValueAtTime(0.08, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
      osc.connect(gain).connect(c.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.02);
    }
  } catch { /* ignore */ }
}

/** Read user preference — defaults to enabled. */
export function soundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('pragati-sound') !== 'off';
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pragati-sound', on ? 'on' : 'off');
}

/** Plays the chime only when the user hasn't muted sounds. */
export function chimeIfEnabled() {
  if (soundEnabled()) playSuccessChime();
}
