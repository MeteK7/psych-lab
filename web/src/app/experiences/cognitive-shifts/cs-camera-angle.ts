import { Component, computed, inject, input, output, signal } from '@angular/core';

import { CS_CAMERA_ANGLE, fill } from '../../../content';
import { StepId } from '../../flow/conditions';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { TextArea } from '../../shared/text-area';
import { InstrumentSlot } from '../../shared/visual/integration/instrument-slot';
import { ViewpointSlot } from '../../shared/visual/integration/viewpoint-slot';
import { canAct, highUpset, noticedRecord, stayedClose } from './cs-logic';
import { CsStore } from './cs-store';

/**
 * Change the camera angle (docs/camera-angle-design.md §2, with the §9.9 decisions and working
 * texts). Go back to a moment through your own eyes, or skip that; step back through the room as
 * far as feels right, or stay close; look at it from there. Further back is never presented as
 * better, and no feeling is expected at the end.
 *
 * One component, one screen per step; the session runner shows the step heading. Everything the
 * person writes stays in CsStore: steps report a rating, the position, option ids and choices only.
 */
@Component({
  selector: 'app-cs-camera-angle',
  imports: [RatingScale, TextArea, InstrumentSlot, ViewpointSlot],
  template: `
    @switch (stage()) {
      @case ('cam_moment') {
        <p class="safety">{{ c.safety }}</p>
        <p>{{ c.moment.intro }}</p>
        <label class="field">
          <span>{{ c.moment.label }}</span>
          <input type="text" maxlength="120" [value]="store.camMoment()" (input)="store.camMoment.set(value($event))" />
        </label>
        <app-rating-scale [item]="c.moment.upset" [(value)]="upset" />
        @if (high()) {
          <!-- Never blocks: the person can pick a lighter moment, carry on, or stop. -->
          <p class="note" role="status">{{ c.moment.high_note }}</p>
        }
        <button class="primary" type="button" [disabled]="!store.camMoment().trim() || upset() === null" (click)="submitMoment()">
          {{ c.next_label }}
        </button>
      }
      @case ('cam_own_eyes') {
        <!-- No figure here: a drawn room would compete with the person's own picture of the moment (§9.3). -->
        <p>{{ c.own_eyes.prompt }}</p>
        <p class="muted">{{ c.own_eyes.short }}</p>
        <p class="muted">{{ c.own_eyes.skip_note }}</p>
        <app-text-area [label]="c.own_eyes.label" [(value)]="ownEyes" />
        <div class="actions">
          <!-- Two equal answers: neither is filled, so neither is favoured (§9.9). -->
          <button type="button" (click)="submitOwnEyes(false)">{{ c.next_label }}</button>
          <button type="button" (click)="submitOwnEyes(true)">{{ c.own_eyes.skip_label }}</button>
        </div>
      }
      @case ('cam_step_back') {
        <p class="note">{{ c.step_back.stand_in }}</p>
        <p>{{ c.step_back.prompt }}</p>
        <div class="control">
          <label>{{ c.step_back.slider_label }}
            <input type="range" min="0" [max]="last" step="1" [value]="store.camPosition()"
                   [attr.aria-valuetext]="c.step_back.positions[store.camPosition()]"
                   (input)="store.camPosition.set($any($event.target).valueAsNumber)" />
          </label>
          <output>{{ c.step_back.positions[store.camPosition()] }}</output>
        </div>
        <app-vis-viewpoint-slot class="figure" instrument="room" [inputs]="roomInputs" [position]="store.camPosition()"
                                (positionChange)="store.camPosition.set($event)" (drawn)="drawn.set($event)" />
        <p class="muted hint">{{ c.step_back.drag_hint }}</p>
        <button class="primary" type="button" (click)="submitStepBack()">{{ c.next_label }}</button>
      }
      @case ('cam_from_here') {
        <!-- The figure still, where the person stopped; the words carry the step without it. -->
        <app-vis-instrument-slot class="figure" role="img" [attr.aria-label]="c.room.alts[store.camPosition()]" instrument="room"
                                 [inputs]="{ view: store.camPosition(), words: c.room }" />
        @if (close()) {
          <!-- Stayed close: a neutral lead and the options only. No question, no writing (§9.9). -->
          <fieldset class="choice">
            <legend>{{ c.from_here.close.lead }}</legend>
            @for (option of c.from_here.close.options; track option.id) {
              <label class="check">
                <input type="checkbox" [checked]="ticked(option.id)" (change)="toggle(option.id)" />
                {{ option.text }}
              </label>
            }
          </fieldset>
        } @else {
          <p>{{ c.from_here.observer.watch }}</p>
          <app-text-area [label]="c.from_here.observer.watch_label" [(value)]="watch" />
          <fieldset class="choice">
            <legend>{{ c.from_here.observer.notice }}</legend>
            <p class="hint muted">{{ c.from_here.observer.hint }}</p>
            @for (option of c.from_here.observer.options; track option.id) {
              <label class="check">
                <input type="checkbox" [checked]="ticked(option.id)" (change)="toggle(option.id)" />
                {{ option.text }}
              </label>
            }
          </fieldset>
          <label class="field">
            <span>{{ c.from_here.observer.own_choice }}</span>
            <span class="sub">{{ c.from_here.observer.own_label }}</span>
            <input type="text" maxlength="120" [value]="store.camOwnNotice()" (input)="store.camOwnNotice.set(value($event))" />
          </label>
        }
        <button class="primary" type="button" (click)="submitFromHere()">{{ c.next_label }}</button>
      }
      @case ('cam_now') {
        <fieldset class="choice">
          <legend>{{ c.now.vantage.question }}</legend>
          @for (option of c.now.vantage.options; track option.id) {
            <label class="check">
              <input type="radio" name="cam-vantage" [checked]="vantage() === option.id" (change)="vantage.set(option.id)" />
              {{ option.label }}
            </label>
          }
        </fieldset>
        <p class="muted">{{ c.now.any_answer }}</p>
        <app-rating-scale [item]="c.now.upset" [(value)]="upset" />
        <!-- Shown only after rating, so the earlier number doesn't pull the new answer towards it. -->
        @if (upset() !== null) {
          <p class="note" role="status">{{ say(c.now.compared, { before: store.camUpsetBefore() ?? 0, now: upset() ?? 0 }) }}</p>
        }
        <fieldset class="choice">
          <legend>{{ c.now.control.question }}</legend>
          @for (option of c.now.control.options; track option.id) {
            <label class="inline">
              <input type="radio" name="cam-control" [checked]="store.camControl() === option.id" (change)="store.camControl.set(option.id)" />
              {{ option.label }}
            </label>
          }
        </fieldset>
        <button class="primary" type="button" [disabled]="!vantage() || upset() === null || !store.camControl()" (click)="submitNow()">
          {{ c.next_label }}
        </button>
      }
      @case ('cam_close') {
        <p class="quote">{{ say(c.close.moment, { moment: store.camMoment() }) }}</p>
        @if (noticedTexts().length) {
          <p>{{ c.close.noticed }}</p>
          <ul class="kept">
            @for (text of noticedTexts(); track $index) {
              <li>{{ text }}</li>
            }
          </ul>
        }
        @if (written().length) {
          <p>{{ c.close.wrote }}</p>
          <ul class="kept">
            @for (text of written(); track $index) {
              <li class="written">{{ text }}</li>
            }
          </ul>
        }
        @if (!noticedTexts().length && !written().length) {
          <p>{{ c.close.nothing_kept }}</p>
        }
        <p class="note">{{ c.close.heavier }}</p>
        <p class="note">{{ close() ? c.close.stayed_close : c.close.stepped_back }}</p>
        @if (actionable()) {
          <p class="note">{{ c.close.control }}</p>
        }
        <button class="primary" type="button" (click)="finish()">{{ c.finish_label }}</button>
      }
    }
  `,
  styles: `
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .quote { font-size: 1.1rem; }
    .muted { color: var(--muted); }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; max-width: 32rem; }
    .field input { padding: 0.4rem; font: inherit; }
    .sub { font-size: 0.875rem; color: var(--muted); }
    .choice { border: 0; padding: 0; margin: 0 0 1rem; }
    .choice legend { font-weight: 600; margin-bottom: 0.5rem; }
    .check { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.4rem; }
    .inline { display: inline-flex; gap: 0.35rem; align-items: center; margin-right: 1rem; }
    .hint { margin: 0 0 0.5rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
    .control { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: center; margin: 0.5rem 0; }
    .control input { vertical-align: middle; margin-left: 0.5rem; }
    .figure { display: block; max-width: 48rem; margin: 0.5rem 0 1rem; border-radius: 8px; overflow: hidden; }
    .note { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .kept { margin-top: 0; }
    .written { white-space: pre-line; }
  `,
})
export class CsCameraAngle implements Experience {
  readonly stage = input.required<StepId>();
  readonly completed = output<StepOutcome>();

  protected readonly c = CS_CAMERA_ANGLE;
  protected readonly store = inject(CsStore);
  protected readonly last = CS_CAMERA_ANGLE.step_back.positions.length - 1;
  /** The figure's inputs: the exercise's own words, never the person's. */
  protected readonly roomInputs = { words: CS_CAMERA_ANGLE.room };

  protected readonly upset = signal<number | null>(null);
  protected readonly ownEyes = signal(this.store.camOwnEyes());
  protected readonly watch = signal(this.store.camWatch());
  protected readonly vantage = signal<'own_eyes' | 'both' | 'outside' | null>(null);
  /** What the step 3 figure drew, once it loaded; absent if it never did. */
  protected readonly drawn = signal<string | null>(null);

  protected readonly high = computed(() => highUpset(this.upset()));
  protected readonly close = computed(() => stayedClose(this.store.camPosition()));
  protected readonly options = computed(() => (this.close() ? this.c.from_here.close.options : this.c.from_here.observer.options));
  protected readonly actionable = computed(() => canAct(this.store.camControl()));
  protected readonly noticedTexts = computed(() => [
    ...this.options().filter((o) => this.store.camNoticed().includes(o.id)).map((o) => o.text),
    ...(!this.close() && this.store.camOwnNotice().trim() ? [this.store.camOwnNotice().trim()] : []),
  ]);
  protected readonly written = computed(() =>
    [this.store.camOwnEyes(), this.close() ? '' : this.store.camWatch()].map((t) => t.trim()).filter((t) => t),
  );

  protected say(text: string, values: Record<string, string | number>): string {
    return fill(text, values);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected ticked(id: string): boolean {
    return this.store.camNoticed().includes(id);
  }

  protected toggle(id: string): void {
    this.store.camNoticed.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  protected submitMoment(): void {
    this.store.camUpsetBefore.set(this.upset());
    this.completed.emit({ result: {}, ratings: { cam_upset_pre: this.upset()! } });
  }

  /** A skip leaves nothing behind: what was typed before skipping isn't kept or shown back. */
  protected submitOwnEyes(skip: boolean): void {
    this.store.camOwnEyes.set(skip ? '' : this.ownEyes());
    // The same record either way: a skip adds no data (§9.9).
    this.completed.emit({ result: {} });
  }

  protected submitStepBack(): void {
    const source = this.drawn();
    this.completed.emit({ result: { position: this.store.camPosition(), ...(source ? { visual_source: source } : {}) } });
  }

  protected submitFromHere(): void {
    this.store.camWatch.set(this.close() ? '' : this.watch());
    if (this.close()) this.store.camOwnNotice.set('');
    const order = this.options().map((o) => o.id);
    this.store.camNoticed.update((ids) => ids.filter((id) => order.includes(id)));
    this.completed.emit({
      result: { noticed: noticedRecord(order, this.store.camNoticed(), this.close() ? '' : this.store.camOwnNotice()) },
    });
  }

  protected submitNow(): void {
    this.completed.emit({
      result: { vantage: this.vantage(), control: this.store.camControl() },
      ratings: { cam_upset_post: this.upset()! },
    });
  }

  protected finish(): void {
    this.completed.emit({
      result: {},
      next: this.actionable() ? { label: this.c.close.plan_link, exercise: 'action_bridge' } : undefined,
    });
  }
}
