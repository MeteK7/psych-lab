import { Component, DestroyRef, inject, signal } from '@angular/core';

import { FrameReport, FrameWatch } from '../../shared/visual/integration/frame-watch';

interface Row {
  label: string;
  backend: string;
  report: FrameReport;
}

/**
 * The Visual Lab's performance overlay (milestone M6, S10): for each figure on the page that has
 * moved, its backend, how much motion was measured, its own frame rate while moving, the display
 * interval and missed refreshes, our code's work per frame against half the interval, and whether
 * the watchdog moved it to the reduced tier. Read twice a second while it's open; closed, nothing runs.
 */
@Component({
  selector: 'app-lab-overlay',
  styleUrls: ['./lab.css'],
  styles: `
    .overlay { position: fixed; right: 12px; bottom: 12px; z-index: 1000; max-height: 45vh; overflow: auto; max-width: 860px;
               background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.75rem;
               box-shadow: 0 2px 10px rgb(0 0 0 / 0.15); font-size: 0.8rem; }
    td, th { padding: 0.1rem 0.6rem 0.1rem 0; text-align: left; white-space: nowrap; }
    .over { font-weight: 700; }
  `,
  template: `
    <label class="tier"><input type="checkbox" [checked]="open()" (change)="toggle($any($event.target).checked)" /> Performance overlay</label>
    @if (open()) {
      <div class="overlay" role="region" aria-label="Performance overlay" data-overlay>
        <p class="muted">Figures that have moved, over their last second of motion. Frame rate: the figure's own frames while moving
          (the watchdog moves motion to the reduced tier below 50 fps). Work: our code per frame, against half the display interval;
          with SVG the browser's own painting shows in the frame rate instead. Browser frame time.</p>
        @if (rows().length) {
          <table>
            <thead><tr><th scope="col">Figure</th><th scope="col">Backend</th><th scope="col">Motion</th><th scope="col">Frame rate</th>
              <th scope="col">Interval</th><th scope="col">Missed</th><th scope="col">Work (median / max / budget)</th><th scope="col">Tier</th></tr></thead>
            <tbody>
              @for (r of rows(); track $index) {
                <tr [attr.data-overlay-row]="r.label">
                  <th scope="row">{{ r.label }}</th>
                  <td>{{ r.backend }}</td>
                  <td>{{ (r.report.motionMs / 1000).toFixed(2) }} s, {{ r.report.frames }} frames</td>
                  <td>{{ r.report.rate === null ? '—' : r.report.rate.toFixed(0) + ' fps' }}</td>
                  <td>{{ r.report.interval === null ? '—' : r.report.interval.toFixed(2) + ' ms' }}</td>
                  <td>{{ r.report.missed }} ({{ (r.report.missedShare * 100).toFixed(1) }}%)</td>
                  <td [class.over]="r.report.work.over > 0">
                    {{ r.report.work.median.toFixed(2) }} / {{ r.report.work.max.toFixed(2) }} / {{ r.report.work.budget === null ? '—' : r.report.work.budget.toFixed(1) }} ms
                    @if (r.report.work.over) { ({{ r.report.work.over }} over) }
                  </td>
                  <td [attr.data-tier]="r.report.dropped ? 'reduced' : 'full'">{{ r.report.dropped ? 'reduced (watchdog)' : 'full' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p data-overlay-empty>No figure has moved yet. Play a change in the Lab.</p>
        }
      </div>
    }
  `,
})
export class LabOverlay {
  private readonly watch = inject(FrameWatch);
  protected readonly open = signal(false);
  protected readonly rows = signal<Row[]>([]);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.toggle(false));
  }

  protected toggle(open: boolean): void {
    this.open.set(open);
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    if (!open) return;
    this.read();
    this.timer = setInterval(() => this.read(), 500);
  }

  private read(): void {
    this.rows.set(
      this.watch
        .figures()
        .map((f) => ({ label: f.label(), backend: f.backend, report: f.stats.report() }))
        .filter((r) => r.report.frames > 0 || r.report.dropped),
    );
  }
}
