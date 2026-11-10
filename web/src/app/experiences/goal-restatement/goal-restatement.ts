import { Component, computed, output, signal } from '@angular/core';

import { GOAL_RESTATEMENT } from '../../../content';
import { Experience, StepOutcome } from '../../flow/step-outcome';

/** Active control for Action Bridge: states the goal, with no cue, if-then or obstacle plan. */
@Component({
  selector: 'app-goal-restatement',
  template: `
    <p>{{ content.intro }}</p>

    @if (stage() === 'write') {
      <form (submit)="$event.preventDefault(); toReadBack()">
        <label class="field">
          <span>{{ content.goal.label }}</span>
          <input type="text" [placeholder]="content.goal.placeholder" [value]="goal()"
                 (input)="goal.set(value($event))" required />
        </label>
        <label class="field">
          <span>{{ content.topic.label }}</span>
          <input type="text" [placeholder]="content.topic.placeholder" [value]="topic()"
                 (input)="topic.set(value($event))" required />
        </label>
        <button class="primary" type="submit" [disabled]="!complete()">Continue</button>
      </form>
    } @else {
      <h3>{{ content.read_back.heading }}</h3>
      <blockquote class="plan">
        {{ content.read_back.goal_prefix }} {{ goal().trim() }}<br />
        {{ content.read_back.topic_prefix }} {{ topic().trim() }}
      </blockquote>
      <p>{{ content.read_back.instruction }}</p>
      <label class="inline">
        <input type="checkbox" [checked]="readBack()" (change)="readBack.set(!readBack())" />
        {{ content.read_back.confirm }}
      </label>
      <div class="actions">
        <button type="button" (click)="stage.set('write')">{{ content.read_back.change }}</button>
        <button class="primary" type="button" [disabled]="!readBack()" (click)="finish()">Continue</button>
      </div>
    }
  `,
  styles: `
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
    .field input { padding: 0.4rem; font: inherit; }
    .inline { display: inline-flex; gap: 0.35rem; align-items: center; }
    .plan { font-size: 1.15rem; border-left: 4px solid var(--accent); margin: 1rem 0; padding: 0.5rem 1rem; }
    .actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
  `,
})
export class GoalRestatement implements Experience {
  readonly completed = output<StepOutcome>();

  protected readonly content = GOAL_RESTATEMENT;
  protected readonly stage = signal<'write' | 'read_back'>('write');
  protected readonly goal = signal('');
  protected readonly topic = signal('');
  protected readonly readBack = signal(false);
  protected readonly complete = computed(
    () => this.goal().trim().length > 0 && this.topic().trim().length > 0,
  );

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected toReadBack(): void {
    if (!this.complete()) return;
    this.readBack.set(false);
    this.stage.set('read_back');
  }

  protected finish(): void {
    this.completed.emit({
      result: { read_back: true },
      plan: { type: 'goal_restatement', goal: this.goal().trim(), topic: this.topic().trim(), read_back: true },
    });
  }
}
