import { Component, computed, output, signal } from '@angular/core';

import { ACTION_BRIDGE, CueType } from '../../../content';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { ActionBridgeInput, isPlanComplete, planText } from './plan-text';

@Component({
  selector: 'app-action-bridge',
  template: `
    <h2>{{ content.title }}</h2>
    <p>{{ content.intro }}</p>

    @if (stage() === 'write') {
      <form (submit)="$event.preventDefault(); toRehearsal()">
        <label class="field">
          <span>{{ content.goal.label }}</span>
          <input type="text" [placeholder]="content.goal.placeholder" [value]="form().goal"
                 (input)="set('goal', $event)" required />
        </label>

        <fieldset class="field">
          <legend>When will you start? Choose a cue.</legend>
          @for (cue of content.cue_types; track cue.value) {
            <label class="inline">
              <input type="radio" name="cue-type" [value]="cue.value"
                     [checked]="form().cueType === cue.value" (change)="setCueType(cue.value)" />
              {{ cue.label }}
            </label>
          }
          <label class="field">
            <span>{{ selectedCue().prefix }}…</span>
            <input type="text" [placeholder]="selectedCue().placeholder" [value]="form().cue"
                   (input)="set('cue', $event)" required />
          </label>
        </fieldset>

        <label class="field">
          <span>{{ content.first_step.label }}</span>
          <input type="text" [placeholder]="content.first_step.placeholder" [value]="form().firstStep"
                 (input)="set('firstStep', $event)" required />
        </label>

        <label class="field">
          <span>{{ content.obstacle.label }}</span>
          <input type="text" [placeholder]="content.obstacle.placeholder" [value]="form().obstacle"
                 (input)="set('obstacle', $event)" />
        </label>
        <label class="field">
          <span>{{ content.obstacle_response.label }}</span>
          <input type="text" [placeholder]="content.obstacle_response.placeholder"
                 [value]="form().obstacleResponse" (input)="set('obstacleResponse', $event)" />
        </label>

        <button type="submit" [disabled]="!complete()">Continue</button>
      </form>
    } @else {
      <p>{{ content.rehearsal.instruction }}</p>
      <blockquote class="plan">{{ text() }}</blockquote>
      <label class="inline">
        <input type="checkbox" [checked]="rehearsed()" (change)="rehearsed.set(!rehearsed())" />
        {{ content.rehearsal.confirm }}
      </label>
      <div class="actions">
        <button type="button" (click)="stage.set('write')">Edit plan</button>
        <button type="button" [disabled]="!rehearsed()" (click)="finish()">Continue</button>
      </div>
    }
  `,
  styles: `
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; border: 0; padding: 0; }
    .field input[type='text'] { padding: 0.4rem; font: inherit; }
    .inline { display: inline-flex; gap: 0.35rem; margin-right: 1rem; align-items: center; }
    legend { margin-bottom: 0.25rem; }
    .plan { font-size: 1.15rem; border-left: 4px solid var(--accent); margin: 1rem 0; padding: 0.5rem 1rem; }
    .actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
  `,
})
export class ActionBridge implements Experience {
  readonly completed = output<StepOutcome>();

  protected readonly content = ACTION_BRIDGE;
  protected readonly stage = signal<'write' | 'rehearse'>('write');
  protected readonly rehearsed = signal(false);
  protected readonly form = signal<ActionBridgeInput>({
    goal: '',
    cueType: 'time',
    cue: '',
    firstStep: '',
    obstacle: '',
    obstacleResponse: '',
  });

  protected readonly selectedCue = computed(
    () => this.content.cue_types.find((c) => c.value === this.form().cueType) ?? this.content.cue_types[0],
  );
  protected readonly complete = computed(() => isPlanComplete(this.form()));
  protected readonly text = computed(() => planText(this.content, this.form()));

  protected set(field: keyof Omit<ActionBridgeInput, 'cueType'>, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  protected setCueType(cueType: CueType): void {
    this.form.update((f) => ({ ...f, cueType }));
  }

  protected toRehearsal(): void {
    if (!this.complete()) return;
    this.rehearsed.set(false);
    this.stage.set('rehearse');
  }

  protected finish(): void {
    const f = this.form();
    const plan = {
      type: 'action_bridge',
      goal: f.goal.trim(),
      cue_type: f.cueType,
      cue: f.cue.trim(),
      first_step: f.firstStep.trim(),
      obstacle: f.obstacle.trim() || null,
      obstacle_response: f.obstacleResponse.trim() || null,
      plan_text: this.text(),
      rehearsed: true,
    };
    this.completed.emit({ result: { rehearsed: true, has_obstacle_plan: !!plan.obstacle }, plan });
  }
}
