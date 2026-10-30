import { DatePipe } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../api/api.service';
import { Condition, Mode, Status } from '../api/types';
import { ActionBridge } from '../experiences/action-bridge/action-bridge';
import { GoalRestatement } from '../experiences/goal-restatement/goal-restatement';
import { RatingStep } from '../experiences/rating-step/rating-step';
import { StateReset } from '../experiences/state-reset/state-reset';
import { CONDITIONS, MODES, StepId, isCondition, isLevelAMode, stepsFor } from './conditions';
import { SessionDraft, addStep, addStop, newDraft, toUpsert } from './session-record';
import { StepOutcome } from './step-outcome';

/** Minutes after the session ends during which starting is measured (plan §4.2). */
export const OUTCOME_WINDOW_MINUTES = 120;

type SaveState = 'idle' | 'saving' | 'error';

@Component({
  selector: 'app-session-page',
  imports: [ActionBridge, GoalRestatement, RatingStep, StateReset, DatePipe, RouterLink],
  template: `
    @if (!setup()) {
      <h1>Session</h1>
      <p role="alert">This session link is missing a valid condition or mode.</p>
      <a routerLink="/">Back to Today</a>
    } @else if (!draft()) {
      <!-- Nothing is recorded until Begin, so a refresh or hot reload never creates a session. -->
      <h1>Session</h1>
      <p>
        Condition: {{ conditionLabel() }} · {{ modeLabel() }}
        @if (setup()?.revealId) {
          <span class="assigned">(assigned for today)</span>
        }
      </p>
      <p>The session is saved after each step. You can stop at any time.</p>
      <button type="button" (click)="begin()">Begin session</button>
      <p><a [routerLink]="homeLink()">Back</a></p>
    } @else {
      <h1>Session</h1>
      @if (finished(); as end) {
        <section aria-labelledby="done-heading">
          <h2 id="done-heading" tabindex="-1" #focusTarget>
            {{ end.status === 'completed' ? 'Session complete' : 'Session stopped' }}
          </h2>
          @if (saveState() === 'error') {
            <p role="alert">The session could not be saved. Is the API running?</p>
            <button type="button" (click)="save(end.status, end.at)">Retry saving</button>
          } @else if (saveState() === 'saving') {
            <p role="status">Saving…</p>
          } @else {
            <p role="status">Saved. Ended at {{ end.at | date: 'HH:mm' }}.</p>
            @if (end.status === 'completed') {
              <p>The {{ windowMinutes }}-minute window runs until {{ windowEnd() | date: 'HH:mm' }}.</p>
            }
            @if (setup()?.revealId) {
              <p><a routerLink="/" class="primary-link">Back to Today</a></p>
            } @else {
              <p><a routerLink="/history">History</a> · <a routerLink="/dev">Start another session</a></p>
            }
          }
        </section>
      } @else {
        <p class="progress" tabindex="-1" #focusTarget>
          Step {{ index() + 1 }} of {{ steps().length }} · {{ conditionLabel() }}
        </p>
        @if (saveState() === 'error') {
          <p role="alert">
            Progress could not be saved. You can continue; it will be saved again after the next step.
          </p>
        }
        @switch (step()) {
          @case ('pre_rating') {
            <app-rating-step phase="pre" (completed)="onCompleted($event)" />
          }
          @case ('post_rating') {
            <app-rating-step phase="post" (completed)="onCompleted($event)" />
          }
          @case ('state_reset') {
            <app-state-reset variant="image" (completed)="onCompleted($event)" (stopped)="stop()" />
          }
          @case ('game_only') {
            <app-state-reset variant="game_only" (completed)="onCompleted($event)" (stopped)="stop()" />
          }
          @case ('action_bridge') {
            <app-action-bridge (completed)="onCompleted($event)" />
          }
          @case ('goal_restatement') {
            <app-goal-restatement (completed)="onCompleted($event)" />
          }
        }
        @if (step() !== 'state_reset' && step() !== 'game_only') {
          <button type="button" class="stop" (click)="stop()">Stop the session</button>
        }
      }
    }
  `,
  styles: `
    .progress, .assigned { color: var(--muted); }
    .stop { margin-top: 1.5rem; }
    .primary-link { font-weight: 600; font-size: 1.1rem; }
  `,
})
export class SessionPage {
  private readonly api = inject(ApiService);
  private readonly focusTarget = viewChild<ElementRef<HTMLElement>>('focusTarget');

  protected readonly windowMinutes = OUTCOME_WINDOW_MINUTES;
  protected readonly setup = signal<{
    mode: Mode;
    condition: Condition;
    revealId: string | null;
  } | null>(null);
  protected readonly homeLink = computed(() => (this.setup()?.revealId ? '/' : '/dev'));
  protected readonly draft = signal<SessionDraft | null>(null);
  protected readonly index = signal(0);
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly finished = signal<{ status: Exclude<Status, 'in_progress'>; at: string } | null>(null);

  protected readonly steps = computed<StepId[]>(() => {
    const s = this.setup();
    return s ? stepsFor(s.condition) : [];
  });
  protected readonly step = computed(() => this.steps()[this.index()]);
  protected readonly conditionLabel = computed(
    () => CONDITIONS.find((c) => c.value === this.setup()?.condition)?.label ?? '',
  );
  protected readonly modeLabel = computed(
    () => MODES.find((m) => m.value === this.setup()?.mode)?.label ?? '',
  );
  protected readonly windowEnd = computed(() => {
    const end = this.finished();
    return end ? new Date(Date.parse(end.at) + OUTCOME_WINDOW_MINUTES * 60_000).toISOString() : null;
  });

  private stepStartedAt = new Date().toISOString();
  private saveQueue: Promise<void> = Promise.resolve();

  constructor() {
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    const condition = params.get('condition');
    const mode = params.get('mode');
    // n-of-1 sessions carry the reveal that assigned their condition (from Today).
    const revealId = params.get('reveal');
    if (isCondition(condition) && isLevelAMode(mode)) this.setup.set({ mode, condition, revealId });
  }

  protected begin(): void {
    const setup = this.setup();
    if (!setup || this.draft()) return;
    const now = new Date().toISOString();
    this.draft.set(
      newDraft(crypto.randomUUID(), setup.mode, setup.condition, now, setup.revealId),
    );
    this.stepStartedAt = now;
    void this.save('in_progress', null);
    this.focusSoon();
  }

  protected onCompleted(outcome: StepOutcome): void {
    const draft = this.draft();
    if (!draft) return;
    const now = new Date().toISOString();
    this.draft.set(addStep(draft, this.step(), this.stepStartedAt, now, outcome));
    this.stepStartedAt = now;

    if (this.index() + 1 >= this.steps().length) {
      this.finished.set({ status: 'completed', at: now });
      void this.save('completed', now);
    } else {
      this.index.update((i) => i + 1);
      void this.save('in_progress', null);
    }
    this.focusSoon();
  }

  protected stop(): void {
    const draft = this.draft();
    if (!draft || !confirm('Stop this session? It will be saved as stopped.')) return;
    const now = new Date().toISOString();
    this.draft.set(addStop(draft, this.step(), now));
    this.finished.set({ status: 'aborted', at: now });
    void this.save('aborted', now);
    this.focusSoon();
  }

  /** Saves run one after another, so an older in-progress save can never land after the final one. */
  save(status: Status, endedAt: string | null): Promise<void> {
    const draft = this.draft();
    if (!draft) return this.saveQueue;
    const body = toUpsert(draft, status, endedAt);
    this.saveQueue = this.saveQueue.then(async () => {
      this.saveState.set('saving');
      try {
        await firstValueFrom(this.api.saveSession(draft.id, body));
        this.saveState.set('idle');
      } catch {
        this.saveState.set('error');
      }
    });
    return this.saveQueue;
  }

  private focusSoon(): void {
    setTimeout(() => this.focusTarget()?.nativeElement.focus());
  }
}
