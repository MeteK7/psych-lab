import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, viewChild } from '@angular/core';

import { paintOnCanvas } from '../rendering/canvas/canvas-backend';
import { tokenColours } from '../rendering/canvas/colour';
import type { ResolvedFrame } from '../rendering/frame';
import { FRAME_CLOCK } from '../rendering/frame-clock';
import type { SurfaceScheme } from '../rendering/svg/svg-backend';
import { DisplayCheck, RunDecision, checkDisplay, decide } from '../stimulus/check';
import { StimulusRun, TimingLog } from '../stimulus/run';
import { StimulusSpec, stimulusProblems } from '../stimulus/spec';

export type { DisplayCheck, RunDecision, StimulusSpec, TimingLog };
export type { EventResult, Verdict } from '../stimulus/run';
export { TIME_LABEL } from '../stimulus/run';
export { decide, stimulusProblems };

/** How long the check before a run watches the frames. */
export const CHECK_MS = 2000;

/**
 * S9 Integration: the stimulus lane's surface (milestone M6). It draws a stimulus on a canvas
 * (the canvas backend's painting, the same as the parity suite checks), on the frame clock:
 * - `check()` watches about 2 s of frames with the page visible and focused and nothing else
 *   moving, and judges the display (stimulus/check.ts);
 * - `run(decision)` plays the stimulus, drawing each produced frame from its slot and time, and
 *   gives the timing log (stimulus/run.ts). Hiding the page interrupts it.
 * Nothing is recorded with a session: the log goes to whoever ran it (the Visual Lab).
 */
@Component({
  selector: 'app-vis-stimulus',
  host: { '[attr.data-vis-theme]': 'resting().theme', '[attr.data-vis-scheme]': 'scheme()' },
  template: `<canvas #canvas aria-hidden="true" [style.aspect-ratio]="aspect()"></canvas>`,
  styleUrls: ['../styling/tokens.css'],
  styles: `
    :host { display: block; }
    canvas { display: block; width: 100%; height: auto; }
  `,
})
export class StimulusSurface {
  readonly spec = input.required<StimulusSpec>();
  readonly scheme = input<SurfaceScheme>('auto');

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly clock = inject(FRAME_CLOCK);
  private readonly colour = tokenColours(this.host);
  private current: StimulusRun | null = null;
  private busy = false;
  /** Why the page stopped being visible and focused during the check under way, if it did. */
  private lost: string | null = null;

  /** The picture between runs: no event showing. */
  protected readonly resting = computed(() => {
    const spec = this.spec();
    return spec.draw({ slot: 0, ms: 0, active: new Set() }, spec.seed, spec.params);
  });
  protected readonly aspect = computed(() => `${this.resting().width} / ${this.resting().height}`);

  constructor() {
    afterNextRender(() => this.paint(this.resting()));
    // Hidden or not focused (minimized, another window in front): a check is refused and a run
    // interrupted. A minimized window can go on producing steady frames for a few seconds, so
    // frame times alone can't tell (measured on this machine, M6 stage B).
    const away = (reason: string) => {
      this.lost ??= reason;
      this.current?.interrupt(reason);
    };
    const hidden = () => document.visibilityState === 'hidden' && away('the page was hidden');
    const blurred = () => away('the page lost focus');
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', blurred);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', blurred);
      this.current?.interrupt('the surface went away');
    });
  }

  private paint(frame: ResolvedFrame): void {
    paintOnCanvas(this.canvas().nativeElement, frame, frame.items.map((item) => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null })), this.colour);
  }

  /** Why a check or run can't start now, or null. */
  private blocked(): string | null {
    if (this.busy) return 'a check or run is already going';
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return "the page isn't visible and focused";
    return null;
  }

  /** Watches the display's frames for about 2 s and judges them. */
  check(): Promise<DisplayCheck> {
    const blocked = this.blocked();
    if (blocked) return Promise.resolve({ ...checkDisplay([]), reasons: [blocked] });
    this.busy = true;
    this.lost = null;
    this.paint(this.resting());
    const times: number[] = [];
    return new Promise((resolve) => {
      const finish = (reason?: string) => {
        this.busy = false;
        const intervals = times.slice(1).map((t, i) => t - times[i]);
        const result = checkDisplay(intervals);
        const why = reason ?? (this.lost ? `${this.lost} during the check` : null);
        resolve(why ? { ...result, stable: false, reasons: [why, ...result.reasons] } : result);
      };
      const step = (time: number) => {
        times.push(time);
        if (time - times[0] >= CHECK_MS) return finish();
        if (this.clock.request(step) === null) finish('this browser gives no animation frames');
      };
      if (this.clock.request(step) === null) finish('this browser gives no animation frames');
    });
  }

  /** Plays the stimulus once, as decided, and gives its timing log. */
  run(decision: RunDecision): Promise<TimingLog> {
    const spec = this.spec();
    const run = new StimulusRun(spec, decision);
    const blocked = this.blocked();
    if (blocked) {
      run.interrupt(blocked);
      return Promise.resolve(run.log());
    }
    this.busy = true;
    this.current = run;
    return new Promise((resolve) => {
      const finish = () => {
        this.busy = false;
        this.current = null;
        this.paint(this.resting());
        resolve(run.log());
      };
      const step = (time: number) => {
        const moment = run.frame(time, this.clock.now());
        if (!moment) return finish();
        this.paint(spec.draw(moment, spec.seed, spec.params));
        if (this.clock.request(step) === null) {
          run.interrupt('this browser gives no animation frames');
          finish();
        }
      };
      if (this.clock.request(step) === null) {
        run.interrupt('this browser gives no animation frames');
        finish();
      }
    });
  }
}
