import { MOTION } from '../styling/vocabulary';
import { cubicBezier, done, easingOf, progress } from './timing';

describe('the timing core (M5)', () => {
  it('solves CSS cubic Bézier curves as browsers do', () => {
    // CSS `ease` at the halfway point of time is about 80% of the way (WebKit's reference value).
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3);
    expect(cubicBezier(0.42, 0, 0.58, 1)(0.5)).toBeCloseTo(0.5, 5);
    for (const css of Object.values(MOTION.easing)) {
      const f = easingOf(css);
      expect([f(0), f(1)]).toEqual([0, 1]);
      // No overshoot and never backwards (visual-policy §3.12: no bounce).
      let last = 0;
      for (let x = 0.05; x <= 1; x += 0.05) {
        expect(f(x)).toBeGreaterThanOrEqual(last - 1e-9);
        expect(f(x)).toBeLessThanOrEqual(1 + 1e-9);
        last = f(x);
      }
    }
    expect(easingOf('linear')(0.3)).toBe(0.3);
    expect(() => easingOf('steps(4)')).toThrow();
  });

  it('gives a track’s progress: held during the delay, eased, then done', () => {
    const track = { delay: 100, duration: 300, easing: 'linear' };
    expect(progress(track, 0)).toBe(0);
    expect(progress(track, 100)).toBe(0);
    expect(progress(track, 250)).toBeCloseTo(0.5, 9);
    expect(progress(track, 400)).toBe(1);
    expect(progress(track, 9999)).toBe(1);
    expect([done(track, 399), done(track, 400)]).toEqual([false, true]);
    expect(progress({ delay: 0, duration: 0, easing: 'linear' }, 0)).toBe(1);
  });
});
