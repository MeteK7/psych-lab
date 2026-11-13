import { DatePipe } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { scienceFor } from '../../content';
import { ApiService } from '../api/api.service';
import { ExerciseId, Mode, Status } from '../api/types';
import { AREAS } from '../areas';
import { ActionBridge } from '../experiences/action-bridge/action-bridge';
import { CsNotEnough } from '../experiences/cognitive-shifts/cs-not-enough';
import { CsOtherReadings } from '../experiences/cognitive-shifts/cs-other-readings';
import { CsStore } from '../experiences/cognitive-shifts/cs-store';
import { CsWhyItHappened } from '../experiences/cognitive-shifts/cs-why-it-happened';
import { GoalRestatement } from '../experiences/goal-restatement/goal-restatement';
import { Mcii } from '../experiences/mcii/mcii';
import { isMciiStage } from '../experiences/mcii/mcii-logic';
import { MciiStore } from '../experiences/mcii/mcii-store';
import { RatingStep } from '../experiences/rating-step/rating-step';
import { exerciseInfo, isExerciseId, stepsFor } from '../experiences/registry';
import { StateReset } from '../experiences/state-reset/state-reset';
import { PageExit } from '../shared/page-exit';
import { ScienceSection } from '../shared/science-section';
import { STEP_NAMES, StepId, isLevelAMode } from './conditions';
import { CHOOSE_SINK, STORAGE_TEXT } from './result-sink';
import { SessionDraft, addStep, addStop, newDraft, toUpsert } from './session-record';
import { StepOutcome } from './step-outcome';

type SaveState = 'idle' | 'saving' | 'error';

/** The exercise runner, opened from an area page (practice) or from My experiment. */
@Component({
  selector: 'app-session-page',
  imports: [
    ActionBridge,
    CsNotEnough,
    CsOtherReadings,
    CsWhyItHappened,
    GoalRestatement,
    Mcii,
    RatingStep,
    StateReset,
    ScienceSection,
    DatePipe,
    RouterLink,
  ],
  // Cognitive shifts and MCII keep their state across steps here, for one exercise only.
  providers: [CsStore, MciiStore],
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
      <p>About {{ info()?.minutes }} minutes. {{ text().before }} You can stop at any time.</p>
      @if (science(); as s) {
        <app-science-section [science]="s" [method]="info()?.method?.name" [open]="openWhy" />
      }
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
            <p role="alert">{{ text().failed }}</p>
            <button type="button" (click)="save(end.status, end.at)">Try again</button>
          } @else if (saveState() === 'saving') {
            <p role="status">Saving…</p>
          } @else {
            <p role="status">
              {{ end.status === 'completed' ? fill(text().completed, (end.at | date: 'HH:mm') ?? '') : text().stopped }}
            </p>
            @if (next(); as n) {
              <!-- A full page load starts the suggested exercise fresh. -->
              <p><a class="primary-link" [href]="'/session?mode=try&condition=' + n.exercise">{{ n.label }}</a></p>
            }
            @if (keepText(); as keep) {
              <!-- Try it keeps no answers, so the person's own words go with them, if they want. -->
              <section class="keep" aria-labelledby="keep-heading">
                <h3 id="keep-heading">Take it with you</h3>
                <p class="kept">{{ keep }}</p>
                <p class="muted">It isn't kept here. Copy it, or save it as a file, if you want it.</p>
                <p class="keep-actions">
                  <button type="button" (click)="copyKeep(keep)">Copy</button>
                  <button type="button" (click)="downloadKeep(keep)">Save as a file</button>
                  <span role="status">{{ keepMessage() }}</span>
                </p>
              </section>
            }
            @if (sink().keeps === 'run-only') {
              <p><button type="button" class="primary" (click)="done()">Done</button></p>
            }
            @if (assigned()) {
              <p><a routerLink="/experiment" class="primary-link">Back to My experiment</a></p>
            } @else {
              <p>
                <a [routerLink]="homeLink()">Back to {{ areaTitle() }}</a>
                <!-- A booth lists no records: they'd belong to other visitors. -->
                @if (!booth) {
                  · <a routerLink="/records">My records</a>
                }
              </p>
            }
          }
          @if (science(); as s) {
            <app-science-section [science]="s" [method]="info()?.method?.name" />
          }
        </section>
      } @else {
        <!-- The step name is the heading; experiences don't repeat their title. -->
        <h2 class="progress" tabindex="-1" #focusTarget>
          Step {{ index() + 1 }} of {{ steps().length }}: {{ stepName() }}
        </h2>
        @if (saveState() === 'error') {
          <p role="alert">{{ text().failedDuring }}</p>
        }
        <!-- Each exercise loads when its step first shows (@defer), so the first download carries none of them. -->
        <!-- Cognitive shifts: one component per exercise, recreated for each step. -->
        @if (csGroup(); as group) {
          @for (s of [step()]; track s) {
            @switch (group) {
              @case ('cs1') {
                @defer (on immediate) {
                  <app-cs-other-readings [stage]="s" (completed)="onCompleted($event)" />
                }
              }
              @case ('cs2') {
                @defer (on immediate) {
                  <app-cs-why-it-happened [stage]="s" (completed)="onCompleted($event)" />
                }
              }
              @case ('cs3') {
                @defer (on immediate) {
                  <app-cs-not-enough [stage]="s" (completed)="onCompleted($event)" />
                }
              }
            }
          }
        }
        <!-- MCII: one component, recreated for each step. -->
        @if (mciiStage(); as stage) {
          @for (s of [stage]; track s) {
            @defer (on immediate) {
              <app-mcii [stage]="s" (completed)="onCompleted($event)" />
            }
          }
        }
        @switch (step()) {
          @case ('pre_rating') {
            @defer (on immediate) {
              <app-rating-step phase="pre" (completed)="onCompleted($event)" />
            }
          }
          @case ('post_rating') {
            @defer (on immediate) {
              <app-rating-step phase="post" (completed)="onCompleted($event)" />
            }
          }
          @case ('state_reset') {
            @defer (on immediate) {
              <app-state-reset variant="image" [assigned]="assigned()"
                               (completed)="onCompleted($event)" (stopped)="stop()" />
            }
          }
          @case ('game_only') {
            @defer (on immediate) {
              <app-state-reset variant="game_only" [assigned]="assigned()"
                               (completed)="onCompleted($event)" (stopped)="stop()" />
            }
          }
          @case ('action_bridge') {
            @defer (on immediate) {
              <app-action-bridge (completed)="onCompleted($event)" />
            }
          }
          @case ('goal_restatement') {
            @defer (on immediate) {
              <app-goal-restatement (completed)="onCompleted($event)" />
            }
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
    .keep { border-left: 4px solid var(--accent); padding-left: 0.75rem; margin: 1rem 0; }
    .keep h3 { font-size: 1rem; margin: 0 0 0.25rem; }
    .kept { white-space: pre-line; }
    .keep-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
    h2 { font-size: 1.15rem; }
  `,
})
export class SessionPage {
  private readonly api = inject(ApiService);
  private readonly focusTarget = viewChild<ElementRef<HTMLElement>>('focusTarget');

  protected readonly setup = signal<{
    mode: Mode;
    condition: ExerciseId;
    revealId: string | null;
  } | null>(null);
  /** Experiment exercises carry the reveal that assigned their condition. */
  protected readonly assigned = computed(() => !!this.setup()?.revealId);
  protected readonly homeLink = computed(() =>
    this.assigned() ? '/experiment' : `/areas/${this.info()?.area ?? 'action-growth'}`,
  );
  protected readonly areaTitle = computed(
    () => AREAS.find((a) => a.id === (this.info()?.area ?? 'action-growth'))?.title ?? '',
  );
  /** Offered on the done screen when an exercise suggests one (Cognitive shifts). */
  protected readonly next = signal<StepOutcome['next'] | null>(null);
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
  protected readonly csGroup = computed(() => {
    const prefix = this.step()?.slice(0, 4);
    return prefix === 'cs1_' || prefix === 'cs2_' || prefix === 'cs3_' ? prefix.slice(0, 3) : null;
  });
  protected readonly mciiStage = computed(() => {
    const step = this.step();
    return isMciiStage(step) ? step : null;
  });
  protected readonly info = computed(() => exerciseInfo(this.setup()?.condition));
  /** Where the record goes, chosen here from the mode; the exercise never knows (result-sink.ts). */
  private readonly chooseSink = inject(CHOOSE_SINK);
  protected readonly sink = computed(() => this.chooseSink(this.setup()?.mode ?? 'try'));
  /** What the screens say about storage, from the same sink. */
  protected readonly text = computed(() => STORAGE_TEXT[this.sink().keeps]);
  /**
   * "Why this exercise?" for practice only. Experiment exercises show exactly what the
   * approved protocol fixes, and a rationale could add an expectancy confound (plan §3.1).
   */
  protected readonly science = computed(() =>
    this.assigned() ? undefined : scienceFor(this.setup()?.condition),
  );
  /** Opened straight away when the area page's "Why this exercise?" link was used. */
  protected readonly openWhy: boolean;
  /** Whether this runs in a booth (M1), as the route found out before opening the page. */
  protected readonly booth: boolean;

  /**
   * What the person wrote that they may want to keep: their plan, or their goal. Only when the
   * sink keeps no answers and the run finished; it stays in this page and is never sent.
   */
  protected readonly keepText = computed(() => {
    const plan = this.draft()?.plan;
    if (this.sink().keeps !== 'run-only' || this.finished()?.status !== 'completed' || !plan) return null;
    const text = plan['plan_text'] ?? plan['goal'];
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  });
  protected readonly keepMessage = signal('');
  private readonly exit = inject(PageExit);

  private stepStartedAt = new Date().toISOString();
  private saveQueue: Promise<void> = Promise.resolve();

  constructor() {
    const route = inject(ActivatedRoute).snapshot;
    const params = route.queryParamMap;
    this.booth = route.data?.['booth'] === true;
    const condition = params.get('condition');
    const mode = params.get('mode');
    // n-of-1 sessions carry the reveal that assigned their condition (from My experiment).
    const revealId = params.get('reveal');
    this.openWhy = params.get('why') === '1';
    if (isExerciseId(condition) && isLevelAMode(mode) && allowed(condition, mode, revealId)) {
      this.setup.set({ mode, condition, revealId });
    }
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
    if (outcome.next) this.next.set(outcome.next);
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
    if (!draft || !confirm(this.text().confirmStop)) return;
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
    const body = this.sink().record(toUpsert(draft, status, endedAt));
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

  protected async copyKeep(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.keepMessage.set('Copied.');
    } catch {
      this.keepMessage.set("It couldn't be copied. You can select the text and copy it yourself.");
    }
  }

  protected downloadKeep(text: string): void {
    this.exit.download(`${this.info()?.label ?? 'Exercise'}.txt`, `${text}
`);
    this.keepMessage.set('Saved as a file.');
  }

  /** Ends the visit: a full load of Home, so nothing from it stays in this tab's memory. */
  protected done(): void {
    this.exit.home();
  }

  protected fill(text: string, time: string): string {
    return text.replace('{time}', time);
  }

  private focusSoon(): void {
    setTimeout(() => this.focusTarget()?.nativeElement.focus());
  }
}

/** Exercises outside the experiment run only in Try it, never with a reveal (API rule too). */
function allowed(exercise: ExerciseId, mode: Mode, revealId: string | null): boolean {
  return exerciseInfo(exercise)?.experiment !== null || (mode === 'try' && revealId === null);
}
