import { rng } from '../generation/random';
import type { ResolvedFrame } from '../rendering/frame';
import { checkDisplay, decide } from './check';
import { StimulusRun } from './run';
import { INTERRUPT_MS, SlotCounter } from './slots';
import { StimulusSpec, stimulusProblems } from './spec';

const blank: ResolvedFrame = { width: 10, height: 10, theme: 'attention', items: [] };
const spec: StimulusSpec = {
  id: 'test.stimulus',
  version: 1,
  seed: 'test',
  params: {},
  design: { refreshHz: 60 },
  events: [
    { id: 'six-frames', at: { frames: 30 }, for: { frames: 6 } },
    { id: 'hundred-ms', at: { ms: 1000 }, for: { ms: 100 } },
  ],
  durationMs: 2000,
  draw: () => blank,
};

/** Frame times of a display at `hz` for `ms`, from time 0. */
const times = (hz: number, ms: number) => Array.from({ length: Math.floor((ms * hz) / 1000) + 1 }, (_, k) => (k * 1000) / hz);
const intervals = (ts: number[]) => ts.slice(1).map((t, i) => t - ts[i]);

describe('the stimulus frame clock: slots counted gap by gap (M6)', () => {
  it('stays exact for 10 minutes at 59.94 Hz, starting from a 60 Hz estimate', () => {
    const counter = new SlotCounter(1000 / 60);
    const ts = times(59.94, 10 * 60 * 1000);
    let last = counter.feed(ts[0]);
    for (let k = 1; k < ts.length; k++) {
      last = counter.feed(ts[k]);
      if (last.slot !== k) throw new Error(`slot ${last.slot} at frame ${k}`);
    }
    expect(last.slot).toBe(ts.length - 1);
    expect(ts.length - 1).toBe(35964);
    expect(counter.interval).toBeCloseTo(1000 / 59.94, 6);
  });

  it('stays exact with missed frames (1–3 slots) and ±1 ms jitter', () => {
    const random = rng('drops');
    const counter = new SlotCounter(1000 / 60);
    const ts = times(59.94, 10 * 60 * 1000);
    let k = 0;
    counter.feed(ts[0]);
    while (k < ts.length - 4) {
      k += random() < 0.05 ? 2 + Math.floor(random() * 3) : 1;
      const step = counter.feed(ts[k] + (random() * 2 - 1));
      if (step.slot !== k) throw new Error(`slot ${step.slot} at frame ${k}`);
    }
  });

  it('counts a 50 ms stall as 3 slots, marks a gap near halfway as uncertain, and ends a run on a gap over 100 ms', () => {
    const counter = new SlotCounter(1000 / 60);
    counter.feed(0);
    expect(counter.feed(50)).toMatchObject({ slot: 3, missed: 2, uncertain: false, interrupted: false });
    expect(counter.feed(50 + 1.5 * (1000 / 60))).toMatchObject({ uncertain: true });
    expect(counter.feed(1000 + INTERRUPT_MS)).toMatchObject({ interrupted: true });
  });
});

describe('the check before a run (M6)', () => {
  it('tells a stable rate that matches, a stable rate that doesn’t, and an unstable rate apart', () => {
    const at60 = checkDisplay(intervals(times(60, 2000)));
    expect(at60).toMatchObject({ stable: true, reasons: [] });
    expect(at60.hz).toBeCloseTo(60, 6);
    const d60 = decide(spec, at60);
    expect([d60.frames.runs, d60.ms.runs]).toEqual([true, true]);

    const d144 = decide(spec, checkDisplay(intervals(times(144, 2000))));
    expect([d144.frames.runs, d144.ms.runs]).toEqual([false, true]);
    expect(d144.frames.reason).toBe('designed for 60.00 Hz; this display runs at 144 Hz');
    expect(d144.events.map((e) => [e.event.id, e.runs, e.on, e.off])).toEqual([
      ['six-frames', false, 30, 36],
      ['hundred-ms', true, 144, 158],
    ]);

    // Variable refresh: intervals anywhere between 7 and 14 ms.
    const random = rng('vrr');
    const vrr = checkDisplay(Array.from({ length: 200 }, () => 7 + random() * 7));
    expect(vrr.stable).toBe(false);
    expect(vrr.reasons[0]).toMatch(/^frame intervals vary too much/);
    expect(decide(spec, vrr).events.every((e) => !e.runs)).toBe(true);
  });

  it('calls a rate that changes between the two seconds unstable, and too short a calibration unjudged', () => {
    const drifting = checkDisplay([...intervals(times(60, 1000)), ...intervals(times(58, 1000))]);
    expect(drifting.stable).toBe(false);
    expect(drifting.reasons.join()).toMatch(/the rate changed between the two seconds/);
    expect(checkDisplay(intervals(times(60, 500))).reasons[0]).toMatch(/^too few frames to judge/);
    // A stall or a hidden page inside the 2 s: refused, however steady the rest was.
    const gap = [...intervals(times(60, 1000)), 250, ...intervals(times(60, 800))];
    expect(checkDisplay(gap)).toMatchObject({ stable: false, reasons: ['the check was interrupted: a gap of 250 ms between frames (a stall, or the page hidden)'] });
  });

  it('refuses a time-based event shorter than one frame', () => {
    const short = { ...spec, events: [{ id: 'flash', at: { ms: 100 }, for: { ms: 3 } }] };
    expect(decide(short, checkDisplay(intervals(times(60, 2000)))).events[0]).toMatchObject({ runs: false, reason: '3 ms is shorter than one frame at 60.00 Hz' });
  });

  it('checks the spec itself', () => {
    expect(stimulusProblems(spec)).toEqual([]);
    expect(
      stimulusProblems({
        ...spec,
        design: undefined,
        events: [
          { id: 'a', at: { frames: 1.5 }, for: { ms: 10 } },
          { id: 'a', at: { ms: 0 }, for: { ms: 9999 } },
        ],
      }),
    ).toEqual(["event 'a': 'at' and 'for' use one unit", "event 'a': its id repeats", "event 'a': it ends after the run (2000 ms)"]);
    expect(stimulusProblems({ ...spec, events: [{ id: 'b', at: { frames: 1.5 }, for: { frames: 2 } }] })).toEqual(["event 'b': frames are whole numbers"]);
  });
});

describe('a run and its timing log (M6)', () => {
  const at60 = decide(spec, checkDisplay(intervals(times(60, 2000))));
  const play = (frameTimes: number[]) => {
    const run = new StimulusRun(spec, at60);
    for (const t of frameTimes) if (run.frame(t) === null && run.done) break;
    return run.log();
  };

  it('shows each event in its planned slots, and says so in browser frame time', () => {
    const log = play(times(60, 2100));
    expect(log.label).toBe('browser frame time (estimated, not display time)');
    expect(log.events.map((e) => [e.id, e.verdict, e.shown?.slots])).toEqual([
      ['six-frames', 'as specified', 6],
      ['hundred-ms', 'as specified', 6],
    ]);
    // Nearest slot at each edge: within half a slot of the requested time.
    const timed = log.events[1].shown!;
    expect(Math.abs(timed.onsetError!)).toBeLessThanOrEqual(1000 / 120);
    expect(Math.abs(timed.offsetError!)).toBeLessThanOrEqual(1000 / 120);
    expect(log.summary).toMatchObject({ missed: 0, uncertain: 0, verdicts: { 'as specified': 2 } });
    expect(log.frames[31].active).toEqual(['six-frames']);
  });

  it('calls an event late when its first slot is missed, and too long when the slot it leaves in is missed', () => {
    const ts = times(60, 2100);
    const lateLog = play(ts.filter((_, k) => k !== 30));
    expect(lateLog.events[0]).toMatchObject({ verdict: 'late onset', shown: { fromSlot: 31, slots: 5 } });
    const longLog = play(ts.filter((_, k) => k !== 36));
    expect(longLog.events[0]).toMatchObject({ verdict: 'too long', shown: { slots: 7 } });
    expect(longLog.summary.missed).toBe(1);
    // A missed slot elsewhere changes nothing about the events.
    expect(play(ts.filter((_, k) => k !== 10)).events.map((e) => e.verdict)).toEqual(['as specified', 'as specified']);
  });

  it('ends on an interruption, and marks events in an unstable second', () => {
    const ts = times(60, 2100);
    const stalled = play([...ts.slice(0, 50), ...ts.slice(58)]);
    expect(stalled.interrupted).toMatch(/^a gap of 150 ms/);
    expect(stalled.events.map((e) => e.verdict)).toEqual(['as specified', 'interrupted']);
    // Every fourth frame missed in the second second: 25% of intervals are long.
    const shaky = play(ts.filter((_, k) => !(k > 60 && k % 4 === 0)));
    expect(shaky.unstableSeconds).toEqual([1]);
    expect(shaky.events[1].verdict).toBe('unstable');
  });

  it('marks a frame whose code started more than half a slot late as uncertain', () => {
    const run = new StimulusRun(spec, at60);
    for (const t of times(60, 2100)) if (run.frame(t, t === (32 * 1000) / 60 ? t + 9 : t + 1) === null && run.done) break;
    const log = run.log();
    expect(log.summary).toMatchObject({ lateFrames: 1, uncertain: 1 });
    expect(log.events[0]).toMatchObject({ verdict: 'as specified', uncertain: true });
  });

  it('runs no refused event', () => {
    const at144 = decide(spec, checkDisplay(intervals(times(144, 2000))));
    const run = new StimulusRun(spec, at144);
    for (const t of times(144, 2100)) run.frame(t);
    const log = run.log();
    expect(log.events[0]).toMatchObject({ verdict: 'refused', note: 'designed for 60.00 Hz; this display runs at 144 Hz' });
    expect(log.frames.some((f) => f.active.includes('six-frames'))).toBe(false);
    expect(log.events[1].verdict).toBe('as specified');
  });
});
