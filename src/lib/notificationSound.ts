/**
 * Short modern "payment received" chime, synthesised with the Web Audio API (no audio file, no
 * third-party sound rights). Two bright notes with a soft attack and a quick decay.
 * The on/off choice is a per-browser preference (localStorage).
 */
const PREF_KEY = "alyusr_notification_sound";

let ctx: AudioContext | null = null;

export function isNotificationSoundEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* preference only */
  }
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, peak: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Plays the chime when enabled. Browsers only allow audio after the user has interacted with the page. */
export async function playNotificationSound(force = false): Promise<void> {
  if (!force && !isNotificationSoundEnabled()) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") await ctx.resume();
    const t = ctx.currentTime + 0.01;
    tone(ctx, 880, t, 0.28, 0.22); // A5
    tone(ctx, 1318.5, t + 0.11, 0.42, 0.18); // E6
  } catch {
    /* audio is optional */
  }
}
