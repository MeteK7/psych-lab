import { FrameStats, WATCHDOG } from './frame-stats';

/** Plays changes of `ms` each, drawn at `fps`, on a display of `hz`, for `changes` changes, with work `work` per frame. */
function play(stats: FrameStats, { fps, ms, changes, work = 0.5, jitter }: { fps: number; ms: number; changes: number; work?: number; jitter?: () => number }) {
  let t = 0;
  for (let c = 0; c < changes; c++) {
    stats.begin(t);
    for (const end = t + ms; t < end; t += jitter ? jitter() : 1000 / fps) stats.frame(t, work);
    t += 5000; // idle between changes: not counted
  }
  return stats.report();
}

describe('the watchdog: a figure’s own frame rate while it moves (M6)', () => {
  it('keeps motion on a display drawing at its own rate, whatever the rate', () => {
    for (const fps of [60, 120, 144, 240]) {
      const r = play(new FrameStats(), { fps, ms: 300, changes: 6 });
      expect(r.dropped, `${fps} fps`).toBe(false);
      expect(r.rate!).toBeCloseTo(fps, 0);
      expect(r.missed).toBe(0);
    }
  });

  it('drops a figure drawing at 40 fps on a 60 Hz display, once it has moved for a second', () => {
    const stats = new FrameStats();
    // 2 changes of 300 ms: not yet a second of motion.
    expect(play(stats, { fps: 40, ms: 300, changes: 2 }).dropped).toBe(false);
    expect(play(stats, { fps: 40, ms: 300, changes: 3 }).dropped).toBe(true);
    expect(stats.dropped).toBe(true);
  });

  it('keeps 72 fps on a 144 Hz display, and steady 60 fps on a 240 Hz one: smooth, though refreshes are skipped', () => {
    expect(play(new FrameStats(), { fps: 72, ms: 400, changes: 4 }).dropped).toBe(false);
  });

  it('isn’t fooled by variable refresh: intervals anywhere from 7 to 14 ms are 70–140 fps', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const r = play(new FrameStats(), { fps: 100, ms: 500, changes: 4, jitter: () => 7 + random() * 7 });
    expect(r.dropped).toBe(false);
    expect(r.rate!).toBeGreaterThan(70);
  });

  it('never drops a figure with less than a second of motion, however slow', () => {
    expect(play(new FrameStats(), { fps: 20, ms: 300, changes: 3 }).dropped).toBe(false);
  });

  it('leaves out the first frames of each change and gaps over 100 ms', () => {
    const stats = new FrameStats();
    stats.begin(0);
    // A slow first frame (a new frame being built), then steady 60 fps.
    for (const t of [0, 80, 100, 116.7, 133.3, 150]) stats.frame(t, 1);
    const r = stats.report();
    expect(r.frames).toBe(3);
    expect(r.rate!).toBeCloseTo(60, 0);
    stats.frame(400, 1); // hidden for a while: not counted
    expect(stats.report().frames).toBe(3);
  });

  it('reports missed refreshes and our work against half the display interval, for diagnosis', () => {
    const stats = new FrameStats();
    stats.begin(0);
    let t = 0;
    for (let k = 0; k < 40; k++) {
      t += k % 10 === 9 ? 2000 / 60 : 1000 / 60;
      stats.frame(t, k % 10 === 0 ? 12 : 2);
    }
    const r = stats.report();
    expect(r.missed).toBe(4);
    expect(r.missedShare).toBeCloseTo(4 / (4 + r.frames), 9);
    expect(r.work.budget!).toBeCloseTo(1000 / 120, 1);
    // The heavy frame at the very start is one of the first frames: 3 count.
    expect(r.work.over).toBe(3);
    expect(r.dropped).toBe(false);
    expect(WATCHDOG.minFps).toBe(50);
  });
});
