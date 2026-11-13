import { InjectionToken } from '@angular/core';

/**
 * S7 Rendering: the clock a backend's frame loop runs on (milestone M5): the time now and the
 * next animation frame. The browser's by default; tests give their own, so a glide can be stepped
 * frame by frame. The stimulus lane's frame clock (M6) builds on it.
 */
export interface FrameClock {
  now(): number;
  /** Calls back once, at the next frame, with that frame's time; null where frames aren't available. */
  request(callback: (time: number) => void): number | null;
  cancel(handle: number): void;
}

export const BROWSER_CLOCK: FrameClock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : 0),
  request: (callback) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : null),
  cancel: (handle) => cancelAnimationFrame(handle),
};

export const FRAME_CLOCK = new InjectionToken<FrameClock>('FRAME_CLOCK', { factory: () => BROWSER_CLOCK });
