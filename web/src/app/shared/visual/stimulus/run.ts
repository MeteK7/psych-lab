import { DisplayCheck, EventPlan, RunDecision, STABILITY } from './check';
import { SlotCounter, SlotStep, median } from './slots';
import { StimulusMoment, StimulusSpec, amountOf } from './spec';

/**
 * A run of a stimulus and its timing log (milestone M6). Fed the browser's frame times, it counts
 * refresh slots (slots.ts), says which events show in each produced frame, and afterwards gives
 * every event a verdict. The log keeps four things apart:
 * - requested: what the spec asks (n frames, or d ms);
 * - estimated refresh slots: worked out from the browser's frame times;
 * - produced frames: the frames the browser called us for, and what each drew;
 * - physical presentation: unknown until the photodiode check, and never claimed here.
 * Frame times are when the browser began each frame; the code for a frame can start later than
 * that (the page was busy). A frame whose code started more than half a slot late may have been
 * shown a slot later, so it is marked uncertain, with how late it was.
 * An event can only be late (its first slot missed) or stay too long (the slot it should leave in
 * missed): a missed slot keeps the old picture up, so nothing is ever shown for fewer slots than
 * planned except by starting late. Nothing is corrected or hidden: no later event is shortened to
 * make up for an earlier one. Pure.
 */

export const TIME_LABEL = 'browser frame time (estimated, not display time)';

export type Verdict = 'as specified' | 'late onset' | 'too long' | 'unstable' | 'interrupted' | 'refused';

export interface FrameRecord extends SlotStep {
  /** Since the run began (ms). */
  ms: number;
  /** How long after its frame time the frame's code started (ms); over half a slot marks it uncertain. */
  late: number;
  /** The events this frame drew. */
  active: string[];
}

export interface EventResult {
  id: string;
  unit: 'frames' | 'ms';
  requested: { at: number; for: number };
  /** The slots planned: from `on` up to, not including, `off`. */
  planned: { on: number; off: number };
  verdict: Verdict;
  /** Why, in words: the refusal, the interruption, or what happened. */
  note: string;
  /** What the produced frames showed (estimated), when it was shown at all. */
  shown?: {
    fromSlot: number;
    /** The first slot it no longer showed in. */
    untilSlot: number;
    slots: number;
    /** Since the run began, and how long, in browser frame time (ms). */
    fromMs: number;
    ms: number;
    /** Time-based events: how far its first and last edge were from the requested times (ms). */
    onsetError?: number;
    offsetError?: number;
  };
  /** A slot it showed in was counted from a gap near halfway between two counts. */
  uncertain: boolean;
}

export interface TimingLog {
  spec: { id: string; version: number; seed: string };
  label: typeof TIME_LABEL;
  check: DisplayCheck;
  frames: FrameRecord[];
  events: EventResult[];
  /** Seconds of the run whose frame intervals failed the stability test (0 is the first second). */
  unstableSeconds: number[];
  interrupted: string | null;
  summary: {
    produced: number;
    slots: number;
    missed: number;
    uncertain: number;
    /** Frames whose code started more than half a slot after their frame time. */
    lateFrames: number;
    longestGap: number;
    medianInterval: number;
    verdicts: Partial<Record<Verdict, number>>;
  };
}

export class StimulusRun {
  private readonly counter: SlotCounter;
  private readonly records: FrameRecord[] = [];
  private start: number | null = null;
  private stopped: string | null = null;
  private finished = false;

  constructor(
    private readonly spec: StimulusSpec,
    private readonly decision: RunDecision,
  ) {
    this.counter = new SlotCounter(decision.check.interval);
  }

  get done(): boolean {
    return this.finished || this.stopped !== null;
  }

  /**
   * A produced frame at `time` (its browser frame time), whose code started at `now`: what to
   * draw, or null once the run is over (finished or interrupted).
   */
  frame(time: number, now = time): StimulusMoment | null {
    if (this.done) return null;
    this.start ??= time;
    const step = this.counter.feed(time);
    const ms = time - this.start;
    if (step.interrupted) {
      this.interrupt(`a gap of ${step.gap!.toFixed(0)} ms between frames (over 100 ms: a stall, or the page hidden)`);
      return null;
    }
    if (ms >= this.spec.durationMs) {
      this.finished = true;
      return null;
    }
    const active = this.decision.events.filter((p) => p.runs && p.on <= step.slot && step.slot < p.off).map((p) => p.event.id);
    const late = Math.max(0, now - time);
    const uncertain = step.uncertain || late > this.counter.interval / 2;
    this.records.push({ ...step, uncertain, late, ms, active });
    return { slot: step.slot, ms, active: new Set(active) };
  }

  /** Ends the run early (the page hidden, the surface gone). */
  interrupt(reason: string): void {
    if (!this.done) this.stopped = reason;
  }

  log(): TimingLog {
    const records = this.records;
    const interval = this.decision.check.interval;
    const unstableSeconds: number[] = [];
    const last = records.length ? records[records.length - 1].ms : 0;
    for (let s = 0; s * 1000 <= last; s++) {
      const gaps = records.filter((r) => r.gap !== null && r.ms >= s * 1000 && r.ms < (s + 1) * 1000).map((r) => r.gap!);
      if (gaps.length < 10) continue;
      const within = gaps.filter((g) => Math.abs(g - interval) <= STABILITY.within * interval).length / gaps.length;
      if (within < STABILITY.share) unstableSeconds.push(s);
    }
    const events = this.decision.events.map((p) => this.result(p, unstableSeconds));
    const verdicts: Partial<Record<Verdict, number>> = {};
    for (const e of events) verdicts[e.verdict] = (verdicts[e.verdict] ?? 0) + 1;
    const gaps = records.flatMap((r) => (r.gap === null ? [] : [r.gap]));
    return {
      spec: { id: this.spec.id, version: this.spec.version, seed: this.spec.seed },
      label: TIME_LABEL,
      check: this.decision.check,
      frames: records,
      events,
      unstableSeconds,
      interrupted: this.stopped,
      summary: {
        produced: records.length,
        slots: records.length ? records[records.length - 1].slot + 1 : 0,
        missed: records.reduce((n, r) => n + r.missed, 0),
        uncertain: records.filter((r) => r.uncertain).length,
        lateFrames: records.filter((r) => r.late > this.counter.interval / 2).length,
        longestGap: gaps.length ? Math.max(...gaps) : 0,
        medianInterval: gaps.length ? median(gaps) : 0,
        verdicts,
      },
    };
  }

  private result(plan: EventPlan, unstableSeconds: number[]): EventResult {
    const { event, unit } = plan;
    const base = {
      id: event.id,
      unit,
      requested: { at: amountOf(event.at), for: amountOf(event.for) },
      planned: { on: plan.on, off: plan.off },
      uncertain: false,
    };
    if (!plan.runs) return { ...base, verdict: 'refused', note: plan.reason };
    const records = this.records;
    const first = records.findIndex((r) => r.slot >= plan.on);
    const after = records.findIndex((r) => r.slot >= plan.off);
    if (first < 0 || after < 0) return { ...base, verdict: 'interrupted', note: this.stopped ?? 'the run ended before it did' };
    const [on, off] = [records[first], records[after]];
    const shown = { fromSlot: on.slot, untilSlot: off.slot, slots: off.slot - on.slot, fromMs: on.ms, ms: off.ms - on.ms };
    const timed =
      unit === 'ms' ? { ...shown, onsetError: on.ms - base.requested.at, offsetError: off.ms - (base.requested.at + base.requested.for) } : shown;
    const uncertain = records.slice(first, after + 1).some((r) => r.uncertain);
    const seconds = new Set(unstableSeconds);
    const unstable = [...Array(Math.floor(off.ms / 1000) - Math.floor(on.ms / 1000) + 1).keys()].some((k) => seconds.has(Math.floor(on.ms / 1000) + k));
    const planned = plan.off - plan.on;
    const [verdict, note]: [Verdict, string] = unstable
      ? ['unstable', 'a second it showed in failed the stability test']
      : on.slot > plan.on
        ? ['late onset', `its first slot was missed: shown from slot ${on.slot} instead of ${plan.on}, for ${shown.slots} of ${planned} slots`]
        : off.slot > plan.off
          ? ['too long', `the slot it should have left in was missed: shown for ${shown.slots} of ${planned} slots`]
          : ['as specified', `shown in slots ${plan.on} to ${plan.off - 1}, ${planned} slots`];
    return { ...base, verdict, note, shown: timed, uncertain };
  }
}
