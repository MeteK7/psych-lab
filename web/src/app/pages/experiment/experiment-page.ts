import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { ApiService } from '../../api/api.service';
import { N1Today } from '../../api/types';
import { conditionInfo } from '../../flow/conditions';

/**
 * My experiment (the n-of-1 routine): plan tomorrow, mark a day off, start today's
 * exercise, and record the start of learning. Identical in every condition (protocol §4).
 */
@Component({
  selector: 'app-experiment-page',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>My experiment: getting started on learning</h1>
    @if (view(); as v) {
      @if (v.test_phase) {
        <p class="test-banner" role="note">Test mode: nothing you do here counts in your experiment.</p>
      }

      @if (v.study_start_target) {
        <section class="card prominent" aria-labelledby="start-heading">
          <h2 id="start-heading">Starting to learn?</h2>
          <p>When you actually begin, write a few words about what you're starting and press the button.</p>
          <form (submit)="$event.preventDefault(); recordStudyStart()">
            <label class="field">
              <span>What are you starting?</span>
              <input type="text" maxlength="300" placeholder="e.g. chapter 3, first worked example"
                     [value]="startText()" (input)="startText.set(value($event))" />
            </label>
            <button type="submit" class="primary" [disabled]="busy() || !startText().trim()">I'm starting now</button>
          </form>
        </section>
      } @else if (v.study_start; as recorded) {
        <p class="card done" role="status">Start recorded at {{ recorded.recorded_at | date: 'HH:mm' }}.</p>
      }

      <details class="how" [open]="v.progress.planned_days === 0">
        <summary>How it works</summary>
        <p>
          This is a personal experiment, run by you, for you. It compares two short exercises to see
          which one helps you start learning.
        </p>
        <ol>
          <li>Plan a start time for the next day, the evening before or earlier.</li>
          <li>
            At that time, press <strong>Start today's exercise</strong>. The app picks one of the two
            exercises at random, so the comparison is fair.
          </li>
          <li>When you actually start learning, come back here and press <strong>I'm starting now</strong>.</li>
        </ol>
        <p>
          Part 1 compares “Plan your first step” with “Write down your goal”. Part 2, later, compares
          the two dot exercises. It takes about 20 to 28 planned days per part.
        </p>
      </details>
      <p class="muted">Experiment days so far: {{ v.progress.session_days }}. Aim: 20 to 28.</p>

      <section class="card" aria-labelledby="today-heading">
        <h2 id="today-heading">{{ v.today | date: 'EEEE d MMMM' }}</h2>
        @switch (v.status) {
          @case ('no_plan') {
            <p>
              Today isn't an experiment day, because no start time was set for it in advance. Days are
              planned at least a day ahead, so the plan doesn't depend on how you feel on the day. You
              can still try any experience from <a routerLink="/">Home</a>, and you can plan tomorrow below.
            </p>
          }
          @case ('pending') {
            <p>Planned start today: <strong>{{ v.plan?.planned_start }}</strong>. At that time, press Start today's exercise.</p>
          }
          @case ('revealed') {
            <p>
              Today's exercise, {{ label(v.reveal?.condition) }}, was picked at
              {{ v.reveal?.revealed_at | date: 'HH:mm' }}. It counts for today even if you don't do it.
            </p>
          }
          @case ('session') {
            <p>Today's exercise is {{ v.session?.status === 'in_progress' ? 'in progress' : 'done' }}.</p>
          }
          @case ('ineligible') {
            <p>You marked today as a day you can't learn ({{ v.plan?.barrier }}). It doesn't count in the experiment.</p>
          }
          @case ('late_barrier') {
            <p>
              You marked today as a day you can't learn after your planned start ({{ v.plan?.barrier }}).
              It counts as a planned day without an exercise.
            </p>
          }
        }

        @if (v.can_start_session && v.reveal === null) {
          <button type="button" class="primary" [disabled]="busy()" (click)="startSession()">
            Start today's exercise
          </button>
        } @else if (v.can_start_session && v.reveal) {
          <button type="button" class="primary" [disabled]="busy()" (click)="openSession()">
            Continue today's exercise
          </button>
        }

        @if (v.can_report_barrier) {
          <details class="barrier">
            <summary>I can't learn today</summary>
            <p>Mark today as a day off, for example if you're ill or travelling.</p>
            @if (v.barrier_would_be_late) {
              <p class="warning" role="note">
                Your planned start ({{ v.plan?.planned_start }}) has passed. If you mark the day off now,
                it still counts as a planned day, without an exercise.
              </p>
            }
            <form (submit)="$event.preventDefault(); reportBarrier()">
              <label class="field">
                <span>Reason</span>
                <input type="text" maxlength="300" [value]="barrierText()"
                       (input)="barrierText.set(value($event))" />
              </label>
              <button type="submit" [disabled]="busy() || !barrierText().trim()">Mark today as a day off</button>
            </form>
          </details>
        }
      </section>

      <section class="card" aria-labelledby="tomorrow-heading">
        <h2 id="tomorrow-heading">Plan tomorrow ({{ v.tomorrow | date: 'EEEE d MMMM' }})</h2>
        <form class="inline-form" (submit)="$event.preventDefault(); planTomorrow()">
          <label class="field">
            <span>When will you start learning?</span>
            <input type="time" required [value]="planTime() || v.tomorrow_plan?.planned_start || ''"
                   (input)="planTime.set(value($event))" />
          </label>
          <button type="submit" [disabled]="busy() || !(planTime() || v.tomorrow_plan)">
            {{ v.tomorrow_plan ? 'Change plan' : 'Save plan' }}
          </button>
        </form>
        @if (v.tomorrow_plan) {
          <p class="muted">Planned for {{ v.tomorrow_plan.planned_start }}.</p>
        }
      </section>

      <p>At the end of the day: add a short follow-up in <a routerLink="/records">My records</a> (2 questions).</p>
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
    .done { color: var(--muted); }
    .test-banner { background: var(--accent); color: var(--bg); padding: 0.5rem 0.75rem; border-radius: 6px; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
    .field input { font: inherit; padding: 0.4rem; max-width: 28rem; }
    .inline-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
    .primary { font-size: 1.05rem; padding: 0.5rem 1rem; margin-top: 0.5rem; }
    .barrier { margin-top: 1rem; }
    .how { margin-bottom: 0.5rem; }
    .how summary { cursor: pointer; font-weight: 600; }
    .warning { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    h2 { font-size: 1.2rem; }
  `,
})
export class ExperimentPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly view = signal<N1Today | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly startText = signal('');
  protected readonly barrierText = signal('');
  protected readonly planTime = signal('');

  constructor() {
    this.api.n1Today().subscribe({
      next: (v) => this.view.set(v),
      error: () => this.loadError.set('My experiment could not be loaded. Is the local server running?'),
    });
  }

  protected label(condition: string | undefined): string {
    return conditionInfo(condition)?.label ?? '';
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

  /** Opens the exercise with the revealed condition; the exercise page cannot change it. */
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
        this.actionError.set(err.error?.detail ?? 'That did not work. Is the local server running?');
      },
    });
  }
}
