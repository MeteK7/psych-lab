import { ToneSettings } from '../../../content';
import { Pitch } from './tones';

// One audio context for the page. Browsers only allow sound after a user gesture, so it is
// created or resumed from a click or key press (the sound check, "Start practice", "I'm
// ready"); later tones then play on their own.
let context: AudioContext | null = null;

export function unlockAudio(): void {
  const Ctor = globalThis.AudioContext;
  if (!Ctor) return; // e.g. test environments without Web Audio
  context ??= new Ctor();
  void context.resume();
}

export function playTone(pitch: Pitch, settings: ToneSettings): void {
  if (!context) return;
  const start = context.currentTime;
  const end = start + settings.tone_ms / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = pitch === 'high' ? settings.high_hz : settings.low_hz;
  // Short fade in and out, so tones don't click.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.01);
}
