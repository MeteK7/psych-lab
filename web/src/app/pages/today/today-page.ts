import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { ApiService } from '../../api/api.service';
import { N1Today } from '../../api/types';
import { CONDITIONS } from '../../flow/conditions';

/**
 * The n-of-1 home page: plan tomorrow, report a barrier, start today's session, and
 * record the study start. Identical in every condition (protocol §4).
 */
@Component({
  selector: 'app-today-page',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Today</h1>
    @if (view(); as v) {
      @if (v.test_phase) {
        <p class="test-banner" role="note">Test phase {{ v.phase }}: nothing here is part of the study.</p>
      }

      @if (v.study_start_target; as target) {
        <section class="card prominent" aria-labelledby="start-heading">
          <h2 id="start-heading">Starting to study?</h2>
          <p>When you begin, write one line about what you're starting.</p>
          <form (submit)="$event.preventDefault(); recordStudyStart()">
            <label class="field">
              <span>What are you starting?</span>
              <input type="text" maxlength="300" [value]="startText()"
                     (input)="startText.set(value($event))" />
            </label>
            <button type="submit" [disabled]="busy() || !startText().trim()">I'm starting now</button>
          </form>
        </section>
      } @else if (v.study_start; as recorded) {
        <p class="card done" role="status">
          Study start recorded at {{ recorded.recorded_at | date: 'HH:mm' }}.
        </p>
      }

      <section class="card" aria-labelledby="today-heading">
        <h2 id="today-heading">{{ v.today | date: 'EEEE d MMMM' }}</h2>
        @switch (v.status) {
          @case ('no_plan') {
            <p>Today wasn't planned the evening before, so it isn't a study day. Plan tomorrow below.</p>
          }
          @case ('pending') {
            <p>Planned start: <strong>{{ v.plan?.planned_start }}</strong></p>
          }
          @case ('revealed') {
            <p>Today's session was opened at {{ v.reveal?.revealed_at | date: 'HH:mm' }} but not finished.</p>
          }
          @case ('session') {
            <p>Today's session is {{ v.session?.status === 'in_progress' ? 'in progress' : 'done' }}.</p>
          }
          @case ('ineligible') {
            <p>Marked as a day you can't study: {{ v.plan?.barrier }}</p>
          }
          @case ('late_barrier') {
            <p>
              Barrier recorded after the planned start: {{ v.plan?.barrier }}.
              This day counts as a study day without a session.
            </p>
          }
        }

        @if (v.can_start_session && v.reveal === null) {
          <button type="button" class="primary" [disabled]="busy()" (click)="startSession()">
            Start today's session
          </button>
        } @else if (v.can_start_session && v.reveal; as reveal) {
          <button type="button" class="primary" [disabled]="busy()" (click)="openSession()">
            Continue today's session ({{ label(reveal.condition) }})
          </button>
        }

        @if (v.can_report_barrier) {
          <details class="barrier">
            <summary>I can't study today</summary>
            @if (v.barrier_would_be_late) {
              <p class="warning" role="note">
                Your planned start ({{ v.plan?.planned_start }}) has passed. A barrier reported now is
                recorded as late, and the day counts as a study day without a session.
              </p>
            }
            <form (submit)="$event.preventDefault(); reportBarrier()">
              <label class="field">
                <span>Reason (e.g. ill, travelling)</span>
                <input type="text" maxlength="300" [value]="barrierText()"
                       (input)="barrierText.set(value($event))" />
              </label>
              <button type="submit" [disabled]="busy() || !barrierText().trim()">Record barrier</button>
            </form>
          </details>
        }
      </section>

      <section class="card" aria-labelledby="tomorrow-heading">
        <h2 id="tomorrow-heading">Plan tomorrow ({{ v.tomorrow | date: 'EEEE d MMMM' }})</h2>
        <form class="inline-form" (submit)="$event.preventDefault(); planTomorrow()">
          <label class="field">
            <span>Planned study start</span>
            <input type="time" required [value]="planTime() || v.tomorrow_plan?.planned_start || ''"
                   (input)="planTime.set(value($event))" />
          </label>
          <button type="submit" [disabled]="busy() || !(planTime() || v.tomorrow_plan)">
            {{ v.tomorrow_plan ? 'Update plan' : 'Save plan' }}
          </button>
        </form>
        @if (v.tomorrow_plan) {
          <p class="muted">Planned for {{ v.tomorrow_plan.planned_start }}.</p>
        }
      </section>

      <p><a routerLink="/history">Add the end-of-day follow-up in History</a></p>
    } @else if (loadError()) {
      <p role="alert">{{ loadError() }}</p>
    } @else {
      <p role="status">Loading…</p>
    }
    @if (actionError()) {
      <p role="alert" class="error">{{ actionError() }}</p>
    }
  `,
  styles: `
    .card { border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin: 0 0 1rem; }
    .prominent { border: 2px solid var(--accent); }
    .prominent h2 { margin-top: 0; }
    .done, .muted { color: var(--muted); }
    .test-banner { background: var(--accent); color: var(--bg); padding: 0.5rem 0.75rem; border-radius: 6px; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
    .field input { font: inherit; padding: 0.4rem; max-width: 28rem; }
    .inline-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
    .primary { font-size: 1.05rem; padding: 0.5rem 1rem; margin-top: 0.5rem; }
    .barrier { margin-top: 1rem; }
    .warning { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    h2 { font-size: 1.2rem; }
  `,
})
export class TodayPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly view = signal<N1Today | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly startText = signal('');
  protected readonly barrierText = signal('');
  protected readonly planTime = signal('');
  protected readonly labels = computed(() => new Map(CONDITIONS.map((c) => [c.value, c.label])));

  constructor() {
    this.api.n1Today().subscribe({
      next: (v) => this.view.set(v),
      error: () => this.loadError.set('Today could not be loaded. Is the API running?'),
    });
  }

  protected label(condition: string): string {
    return this.labels().get(condition as never) ?? condition;
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected planTomorrow(): void {
    const v = this.view();
    const time = this.planTime() || v?.tomorrow_plan?.planned_start;
    if (!v || !time) return;
    this.act(this.api.n1PlanDay(v.tomorrow, time), () => this.planTime.set(''));
  }

  protected reportBarrier(): void {
    this.act(this.api.n1ReportBarrier(this.barrierText().trim()), () => this.barrierText.set(''));
  }

  protected recordStudyStart(): void {
    this.act(this.api.n1StudyStart(this.startText().trim()), () => this.startText.set(''));
  }

  protected startSession(): void {
    this.act(this.api.n1Reveal(), () => this.openSession());
  }

  /** Opens the session with the revealed condition; the session page cannot change it. */
  protected openSession(): void {
    const v = this.view();
    if (!v?.reveal) return;
    void this.router.navigate(['/session'], {
      queryParams: { mode: v.session_mode, condition: v.reveal.condition, reveal: v.reveal.id },
    });
  }

  private act(request: Observable<N1Today>, done: () => void): void {
    this.busy.set(true);
    this.actionError.set(null);
    request.subscribe({
      next: (v) => {
        this.view.set(v);
        this.busy.set(false);
        done();
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.actionError.set(err.error?.detail ?? 'That did not work. Is the API running?');
      },
    });
  }
}
