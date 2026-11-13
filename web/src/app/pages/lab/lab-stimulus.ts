import { Component, computed, signal, viewChild } from '@angular/core';

import {
  DisplayCheck,
  RunDecision,
  StimulusSurface,
  TIME_LABEL,
  TimingLog,
  decide,
  stimulusProblems,
} from '../../shared/visual/integration/stimulus-surface';
import { referenceStimulus } from './lab-stimulus-reference';

/**
 * The Visual Lab's stimulus lane (milestone M6): the check before a run on this display, then a run
 * of the reference stimulus and its timing log, every event with its verdict. Nothing is recorded:
 * the log stays on this page.
 */
@Component({
  selector: 'app-lab-stimulus',
  imports: [StimulusSurface],
  styleUrls: ['./lab.css'],
  styles: `
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin: 0.5rem 0; }
    .surface { max-width: 480px; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.2rem 1rem; font-size: 0.9rem; margin: 0.5rem 0; }
    dt { color: var(--muted); }
    dd { margin: 0; }
    td, th { padding: 0.2rem 0.6rem 0.2rem 0; text-align: left; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-stimulus">
      <h2 id="lab-stimulus">Stimulus lane<span class="meta"> · S7 · S9 · M6 · reference stimulus</span></h2>
      <p class="note muted">
        A stimulus is drawn from its refresh slot and time alone. Events count in frames (exactly that many refreshes, at the rate the
        spec was designed for) or in milliseconds (rounded to the nearest frame at each edge). The check before a run watches the
        display for 2 seconds: frame-based events run only at their design rate, time-based events at any stable rate, nothing on an
        unstable one.
      </p>
      <ul class="notes muted">
        <li>All times here are {{ label }}: when the browser called each frame, near the start of its refresh, not when light left the
          screen. Physical display timing is unverified until the photodiode check.</li>
        <li>Keep this page in front and don't move the pointer while it checks or runs.</li>
      </ul>
      <div class="actions">
        <label class="tier">Frame-based events designed for
          <select [value]="designHz()" (change)="setDesign(+$any($event.target).value)">
            <option value="60">60 Hz</option>
            <option value="144">144 Hz</option>
          </select>
        </label>
        <button type="button" (click)="check()" [disabled]="busy()">Check this display (2 s)</button>
        <button type="button" (click)="run()" [disabled]="busy() || !decision()">Run the reference stimulus</button>
      </div>
      @if (problems.length) {
        <ul class="problems" aria-label="Stimulus spec problems">@for (p of problems; track p) { <li>{{ p }}</li> }</ul>
      }
      <div class="panel light surface"><app-vis-stimulus [spec]="spec()" scheme="light" /></div>

      @if (checked(); as c) {
        <h3>This display</h3>
        <dl data-check>
          <dt>Measured</dt><dd>{{ c.hz.toFixed(2) }} Hz (interval {{ c.interval.toFixed(2) }} ms), from {{ c.frames }} frame intervals</dd>
          <dt>Steadiness</dt><dd>{{ (c.within * 100).toFixed(1) }}% of intervals within ±10% of the median; seconds' medians {{ c.seconds[0].toFixed(2) }} and {{ c.seconds[1].toFixed(2) }} ms</dd>
          <dt>Verdict</dt><dd data-verdict>{{ c.stable ? 'stable' : 'not stable: ' + c.reasons.join('; ') }}</dd>
          @if (decision(); as d) {
            <dt>Frame-based events</dt><dd data-units="frames">{{ d.frames.runs ? 'run' : 'refused' }}: {{ d.frames.reason }}</dd>
            <dt>Time-based events</dt><dd data-units="ms">{{ d.ms.runs ? 'run' : 'refused' }}: {{ d.ms.reason }}</dd>
          }
        </dl>
      }

      @if (log(); as l) {
        <h3>Timing log</h3>
        @if (l.interrupted) { <p class="problems" data-interrupted>Interrupted: {{ l.interrupted }}</p> }
        <dl data-summary>
          <dt>Frames produced</dt><dd>{{ l.summary.produced }} over {{ l.summary.slots }} estimated slots</dd>
          <dt>Missed slots</dt><dd>{{ l.summary.missed }}</dd>
          <dt>Uncertain slots</dt><dd>{{ l.summary.uncertain }} (of which {{ l.summary.lateFrames }} drawn more than half a slot after their frame time)</dd>
          <dt>Longest gap</dt><dd>{{ l.summary.longestGap.toFixed(1) }} ms</dd>
          <dt>Median interval</dt><dd>{{ l.summary.medianInterval.toFixed(2) }} ms</dd>
          <dt>Unstable seconds</dt><dd>{{ l.unstableSeconds.length ? l.unstableSeconds.join(', ') : 'none' }}</dd>
        </dl>
        <table aria-label="Events and their verdicts">
          <thead><tr><th scope="col">Event</th><th scope="col">Requested</th><th scope="col">Planned slots</th><th scope="col">Shown (estimated)</th><th scope="col">Verdict</th></tr></thead>
          <tbody>
            @for (e of l.events; track e.id) {
              <tr [attr.data-event]="e.id">
                <th scope="row">{{ e.id }}</th>
                <td>{{ e.requested.for }} {{ e.unit === 'frames' ? 'frames' : 'ms' }} from {{ e.requested.at }} {{ e.unit === 'frames' ? '' : 'ms' }}</td>
                <td>{{ e.planned.on }}–{{ e.planned.off - 1 }}</td>
                <td>
                  @if (e.shown; as s) {
                    {{ s.slots }} slots, {{ s.ms.toFixed(1) }} ms from {{ s.fromMs.toFixed(1) }} ms
                    @if (s.onsetError !== undefined) { (edges {{ signed(s.onsetError) }} / {{ signed(s.offsetError!) }} ms) }
                    @if (e.uncertain) { · uncertain slot }
                  } @else { — }
                </td>
                <td data-verdict>{{ e.verdict }}<span class="muted">: {{ e.note }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
})
export class LabStimulus {
  protected readonly label = TIME_LABEL;
  protected readonly designHz = signal(60);
  protected readonly spec = computed(() => referenceStimulus(this.designHz()));
  protected readonly problems = stimulusProblems(referenceStimulus(60));
  protected readonly busy = signal(false);
  protected readonly checked = signal<DisplayCheck | null>(null);
  protected readonly decision = computed<RunDecision | null>(() => {
    const c = this.checked();
    return c ? decide(this.spec(), c) : null;
  });
  protected readonly log = signal<TimingLog | null>(null);
  private readonly surface = viewChild.required(StimulusSurface);

  protected setDesign(hz: number): void {
    this.designHz.set(hz);
    this.log.set(null);
  }

  protected async check(): Promise<void> {
    this.busy.set(true);
    this.log.set(null);
    this.checked.set(await this.surface().check());
    this.busy.set(false);
  }

  protected async run(): Promise<void> {
    const decision = this.decision();
    if (!decision) return;
    this.busy.set(true);
    this.log.set(await this.surface().run(decision));
    this.busy.set(false);
  }

  protected signed(n: number): string {
    return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`;
  }
}
