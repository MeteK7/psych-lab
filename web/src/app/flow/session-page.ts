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
import { STEP_NAMES, StepId, conditionInfo, isCondition, isLevelAMode, stepsFor } from './conditions';
import { SessionDraft, addStep, addStop, newDraft, toUpsert } from './session-record';
import { StepOutcome } from './step-outcome';

type SaveState = 'idle' | 'saving' | 'error';

/** The exercise runner, opened from an area page (practice) or from My experiment. */
@Component({
  selector: 'app-session-page',
  imports: [ActionBridge, GoalRestatement, RatingStep, StateReset, DatePipe, RouterLink],
  template: `
    @if (!setup()) {
      <h1>Exercise</h1>
      <p role="alert">This exercise link is incomplete.</p>
      <a routerLink="/">Home</a>
    } @else if (!draft()) {
      <!-- Nothing is recorded until Begin, so a refresh or hot reload never creates a session. -->
      <h1>{{ info()?.label }}</h1>
      <p class="assigned">
        {{ assigned() ? 'Assigned for today by your experiment.' : 'Practice: not part of your experiment.' }}
      </p>
      <h2>What happens</h2>
      <ol>
        @for (line of info()?.summary; track line) {
          <li>{{ line }}</li>
        }
      </ol>
      <p>About {{ info()?.minutes }} minutes. Your answers are saved after each step. You can stop at any time.</p>
      <div class="actions">
        <button type="button" class="primary" (click)="begin()">Begin</button>
        <a [routerLink]="homeLink()">Back</a>
      </div>
    } @else {
      <h1>{{ info()?.label }}</h1>
      @if (finished(); as end) {
        <section aria-labelledby="done-heading">
          <h2 id="done-heading" tabindex="-1" #focusTarget>
            {{ end.status === 'completed' ? 'Exercise complete' : 'Exercise stopped' }}
          </h2>
          @if (saveState() === 'error') {
            <p role="alert">Your answers couldn't be saved. Is the local server running?</p>
            <button type="button" (click)="save(end.status, end.at)">Try again</button>
          } @else if (saveState() === 'saving') {
            <p role="status">Saving…</p>
          } @else {
            <p role="status">
              {{ end.status === 'completed' ? 'Saved at ' + (end.at | date: 'HH:mm') + '.' : 'What you did so far is saved.' }}
            </p>
            @if (assigned()) {
              <p><a routerLink="/experiment" class="primary-link">Back to My experiment</a></p>
            } @else {
              <p><a routerLink="/areas/action-growth">Back to Action and growth</a> · <a routerLink="/records">My records</a></p>
            }
          }
        </section>
      } @else {
        <!-- The step name is the heading; experiences don't repeat their title. -->
        <h2 class="progress" tabindex="-1" #focusTarget>
          Step {{ index() + 1 }} of {{ steps().length }}: {{ stepName() }}
        </h2>
        @if (saveState() === 'error') {
          <p role="alert">
            Your answers couldn't be saved. Is the local server running? You can continue; they'll
            be saved again after the next step.
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
            <app-state-reset variant="image" [assigned]="assigned()"
                             (completed)="onCompleted($event)" (stopped)="stop()" />
          }
          @case ('game_only') {
            <app-state-reset variant="game_only" [assigned]="assigned()"
                             (completed)="onCompleted($event)" (stopped)="stop()" />
          }
          @case ('action_bridge') {
            <app-action-bridge (completed)="onCompleted($event)" />
          }
          @case ('goal_restatement') {
            <app-goal-restatement (completed)="onCompleted($event)" />
          }
        }
        @if (step() !== 'state_reset' && step() !== 'game_only') {
          <button type="button" class="stop" (click)="stop()">Stop the exercise</button>
        }
      }
    }
  `,
  styles: `
    .assigned { color: var(--muted); }
    .stop { display: block; margin-top: 1.5rem; }
    .actions { display: flex; align-items: center; gap: 1.25rem; }
    .primary { font-size: 1.05rem; padding: 0.5rem 1.25rem; }
    .primary-link { font-weight: 600; font-size: 1.1rem; }
    h2 { font-size: 1.15rem; }
  `,
})
export class SessionPage {
  private readonly api = inject(ApiService);
  private readonly focusTarget = viewChild<ElementRef<HTMLElement>>('focusTarget');

  protected readonly setup = signal<{
    mode: Mode;
    condition: Condition;
    revealId: string | null;
  } | null>(null);
  /** Experiment exercises carry the reveal that assigned their condition. */
  protected readonly assigned = computed(() => !!this.setup()?.revealId);
  protected readonly homeLink = computed(() => (this.assigned() ? '/experiment' : '/areas/action-growth'));
  protected readonly draft = signal<SessionDraft | null>(null);
  protected readonly index = signal(0);
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly finished = signal<{ status: Exclude<Status, 'in_progress'>; at: string } | null>(null);

  protected readonly steps = computed<StepId[]>(() => {
    const s = this.setup();
    return s ? stepsFor(s.condition) : [];
  });
  protected readonly step = computed(() => this.steps()[this.index()]);
  protected readonly stepName = computed(() => STEP_NAMES[this.step()]);
  protected readonly info = computed(() => conditionInfo(this.setup()?.condition));

  private stepStartedAt = new Date().toISOString();
  private saveQueue: Promise<void> = Promise.resolve();

  constructor() {
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    const condition = params.get('condition');
    const mode = params.get('mode');
    // n-of-1 sessions carry the reveal that assigned their condition (from My experiment).
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
    if (!draft || !confirm('Stop this exercise? What you did so far will be saved.')) return;
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
