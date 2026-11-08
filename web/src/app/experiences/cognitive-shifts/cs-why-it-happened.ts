import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';

import { CS_WHY_IT_HAPPENED, fill } from '../../../content';
import { StepId } from '../../flow/conditions';
import { CauseMapSlot } from '../../shared/visual/integration/cause-map-slot';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { CardPick } from './card-pick';
import { CausePosition, Reflection, changeOrder, reflections } from './cs-logic';
import { Cause, CsStore, Pick } from './cs-store';

type Axis = 'who' | 'time' | 'scope';
const MIDDLE: CausePosition = { who: 3, time: 3, scope: 3 };
const MAX_CAUSES = 6;
const MIN_CAUSES = 3;

/**
 * CS2 · Why did it happen? (cognitive-shifts-design.md §4): collect causes, place each on
 * three scales, and see them on a map. Cause and setback texts stay in CsStore.
 * The map is the Visual System's cause-map instrument (docs/cs2-visual-proposal.md): it gets the
 * causes' places only, never their texts, which the list under it gives in words.
 */
@Component({
  selector: 'app-cs-why-it-happened',
  imports: [CardPick, NgTemplateOutlet, CauseMapSlot],
  template: `
    @switch (stage()) {
      @case ('cs2_setback') {
        <p class="safety">{{ c.safety }}</p>
        <p>{{ c.setback.intro }}</p>
        <label class="field">
          <span>{{ c.setback.label }}</span>
          <input type="text" maxlength="120" [value]="store.setback()" (input)="store.setback.set(value($event))" />
        </label>
        <button type="button" [disabled]="!store.setback().trim()" (click)="done({ described: true })">
          {{ c.next_label }}
        </button>
      }
      @case ('cs2_first') {
        <app-card-pick [legend]="c.first.ask" [cards]="c.first.cards" [ownChoice]="c.first.own_choice"
                       [ownLabel]="c.first.own_label" [(value)]="pick" />
        <button type="button" [disabled]="!pick()" (click)="submitFirst()">{{ c.next_label }}</button>
      }
      @case ('cs2_more') {
        <fieldset class="choice">
          <legend>{{ c.more.intro }}</legend>
          @for (card of c.more.cards; track card.id) {
            <label class="check">
              <input type="checkbox" [checked]="has(card.id)" [disabled]="!has(card.id) && full()"
                     (change)="toggle(card.id, card.text)" />
              {{ card.text }}
            </label>
          }
        </fieldset>
        <form class="own" (submit)="$event.preventDefault(); addOwn()">
          <label class="field">
            <span>{{ c.more.own_label }}</span>
            <input type="text" maxlength="80" [value]="ownText()" (input)="ownText.set(value($event))" [disabled]="full()" />
          </label>
          <button type="submit" [disabled]="!ownText().trim() || full()">{{ c.more.add }}</button>
        </form>
        <p role="status">{{ say(c.more.count, { n: store.causes().length }) }}</p>
        <p>{{ c.more.your_causes }}</p>
        <ul>
          @for (cause of store.causes(); track $index) {
            <li>{{ cause.text }}</li>
          }
        </ul>
        <button type="button" [disabled]="store.causes().length < minCauses" (click)="submitMore()">{{ c.next_label }}</button>
      }
      @case ('cs2_map') {
        @if (current(); as cause) {
          <h3 class="counter">{{ say(c.map.counter, { n: mapIndex() + 1, total: store.causes().length, cause: cause.text }) }}</h3>
          <div class="map-layout">
            <div>
              @for (axis of c.map.axes; track axis.id) {
                <label class="slider">
                  <span class="ends"><span>{{ axis.low }}</span><span>{{ axis.high }}</span></span>
                  <input type="range" min="1" max="5" step="1" [value]="cause[axis.id]"
                         [attr.aria-label]="axis.low + ' or ' + axis.high"
                         [attr.aria-valuetext]="describe(axis.id, cause[axis.id])"
                         (input)="setPosition(mapIndex(), axis.id, $event)" />
                </label>
              }
            </div>
            <ng-container *ngTemplateOutlet="chart" />
          </div>
          <button type="button" (click)="nextCause()">
            {{ mapIndex() + 1 < store.causes().length ? c.map.next_cause : c.next_label }}
          </button>
        }
      }
      @case ('cs2_reflect') {
        <ng-container *ngTemplateOutlet="chart" />
        @for (key of shown(); track key) {
          <p class="note">{{ c.reflect[key] }}</p>
        }
        @if (shown().includes('heavy') && !full()) {
          <section class="add" aria-labelledby="cs2-add">
            <h3 id="cs2-add">{{ c.reflect.add_heading }}</h3>
            <app-card-pick [legend]="c.more.intro" [cards]="unusedCards()" [ownChoice]="c.more.own_choice"
                           [ownLabel]="c.more.own_label" [(value)]="pick" />
            @if (pick()) {
              @for (axis of c.map.axes; track axis.id) {
                <label class="slider">
                  <span class="ends"><span>{{ axis.low }}</span><span>{{ axis.high }}</span></span>
                  <input type="range" min="1" max="5" step="1" [value]="draft()[axis.id]"
                         [attr.aria-label]="axis.low + ' or ' + axis.high"
                         [attr.aria-valuetext]="describe(axis.id, draft()[axis.id])"
                         (input)="setDraft(axis.id, $event)" />
                </label>
              }
              <button type="button" (click)="addDuringReflect()">{{ c.more.add }}</button>
            }
          </section>
        }
        <button type="button" class="next" (click)="submitReflect()">{{ c.next_label }}</button>
      }
      @case ('cs2_change') {
        <fieldset class="choice">
          <legend>{{ c.change.ask }}</legend>
          @for (cause of ordered(); track $index) {
            <label class="check">
              <input type="radio" name="cs2-change" [checked]="chosen() === cause" (change)="chosen.set(cause)" />
              {{ cause.text }}
            </label>
          }
          <label class="check">
            <input type="radio" name="cs2-change" [checked]="chosen() === 'none'" (change)="chosen.set('none')" />
            {{ c.change.none }}
          </label>
        </fieldset>
        @if (chosen() && chosen() !== 'none') {
          <p class="note">{{ c.change.plan_prompt }}</p>
        }
        <button type="button" [disabled]="!chosen()" (click)="finish()">{{ c.finish_label }}</button>
      }
    }

    <ng-template #chart>
      <figure class="chart">
        <!-- The map loads on demand, holding its space meanwhile. The list below carries the same information. -->
        <app-vis-cause-map-slot role="img" [attr.aria-label]="c.map.chart_label" [causes]="positions()" [placing]="placing()" [axes]="axes" />
        <figcaption>
          <p class="list-heading">{{ c.map.list_heading }}</p>
          <ol class="map-list">
            @for (cause of store.causes(); track $index) {
              <li>{{ listLine(cause) }}</li>
            }
          </ol>
        </figcaption>
      </figure>
    </ng-template>
  `,
  styles: `
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; max-width: 32rem; }
    .field input { padding: 0.4rem; font: inherit; }
    .choice { border: 0; padding: 0; margin: 0 0 1rem; }
    .choice legend { font-weight: 600; margin-bottom: 0.5rem; }
    .check { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.4rem; }
    .own { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    .counter { font-size: 1rem; }
    .map-layout { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); align-items: start; }
    .slider { display: block; margin-bottom: 1rem; }
    .slider input { width: 100%; }
    .ends { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--muted); }
    .chart { margin: 0 0 1rem; max-width: 26rem; }
    .list-heading { font-weight: 600; margin: 0.5rem 0 0.25rem; font-size: 0.9rem; }
    .map-list { margin: 0; padding-left: 1.25rem; font-size: 0.9rem; }
    .note { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .add { border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; margin: 1rem 0; }
    .add h3 { font-size: 1rem; margin-top: 0; }
    .next { display: block; margin-top: 1rem; }
  `,
})
export class CsWhyItHappened implements Experience {
  readonly stage = input.required<StepId>();
  readonly completed = output<StepOutcome>();

  protected readonly c = CS_WHY_IT_HAPPENED;
  protected readonly store = inject(CsStore);
  protected readonly minCauses = MIN_CAUSES;

  protected readonly pick = signal<Pick | null>(null);
  protected readonly ownText = signal('');
  protected readonly mapIndex = signal(0);
  protected readonly draft = signal<CausePosition>({ ...MIDDLE });
  protected readonly added = signal(0);
  protected readonly chosen = signal<Cause | 'none' | null>(null);

  protected readonly full = computed(() => this.store.causes().length >= MAX_CAUSES);
  protected readonly current = computed(() => this.store.causes()[this.mapIndex()]);
  protected readonly shown = computed<Reflection[]>(() => reflections(this.store.causes()));
  protected readonly ordered = computed(() => changeOrder(this.store.causes()));
  protected readonly unusedCards = computed(() => this.c.more.cards.filter((k) => !this.has(k.id)));
  /** The number of the cause being placed (step 4), or 0. */
  protected readonly placing = computed(() => (this.stage() === 'cs2_map' ? this.mapIndex() + 1 : 0));
  /** The causes' places for the map: numbers only, never the texts. */
  protected readonly positions = computed(() => this.store.causes().map(({ who, time }) => ({ who, time })));
  protected readonly axes = {
    left: this.c.map.axes[0].low,
    right: this.c.map.axes[0].high,
    top: this.c.map.axes[1].low,
    bottom: this.c.map.axes[1].high,
  };

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected say(text: string, values: Record<string, string | number>): string {
    return fill(text, values);
  }

  protected describe(axis: Axis, value: number): string {
    const a = this.c.map.axes.find((x) => x.id === axis)!;
    if (value <= 2) return a.low.toLowerCase();
    if (value >= 4) return a.high.toLowerCase();
    return `between ${a.low.toLowerCase()} and ${a.high.toLowerCase()}`;
  }

  /**
   * A cause and its three answers, for the list under the map. A cause that already ends a sentence
   * ("I'm just not good at this.") takes no colon; its answers then start a new sentence.
   */
  protected listLine(cause: Cause): string {
    const answers = `${this.describe('who', cause.who)}, ${this.describe('time', cause.time)}, ${this.describe('scope', cause.scope)}`;
    const text = cause.text.trimEnd();
    if (!/[.!?…]$/.test(text)) return `${text}: ${answers}`;
    return `${text} ${answers.charAt(0).toUpperCase()}${answers.slice(1)}`;
  }

  protected has(id: string): boolean {
    return this.store.causes().some((c) => c.id === id);
  }

  protected toggle(id: string, text: string): void {
    if (this.has(id)) this.store.causes.update((cs) => cs.filter((c) => c.id !== id));
    else if (!this.full()) this.store.causes.update((cs) => [...cs, { id, text, ...MIDDLE }]);
  }

  protected addOwn(): void {
    const text = this.ownText().trim();
    if (!text || this.full()) return;
    this.store.causes.update((cs) => [...cs, { id: 'own', text, ...MIDDLE }]);
    this.ownText.set('');
  }

  protected setPosition(index: number, axis: Axis, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.store.causes.update((cs) => cs.map((c, i) => (i === index ? { ...c, [axis]: value } : c)));
  }

  protected setDraft(axis: Axis, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.draft.update((d) => ({ ...d, [axis]: value }));
  }

  protected done(result: Record<string, unknown>): void {
    this.completed.emit({ result });
  }

  protected submitFirst(): void {
    const pick = this.pick();
    if (!pick) return;
    this.store.causes.set([{ ...pick, ...MIDDLE }]);
    this.done({ first: pick.id });
  }

  protected submitMore(): void {
    this.done({ causes: this.store.causes().map((c) => c.id), count: this.store.causes().length });
  }

  protected nextCause(): void {
    if (this.mapIndex() + 1 < this.store.causes().length) {
      this.mapIndex.update((i) => i + 1);
      return;
    }
    this.done({
      positions: this.store.causes().map(({ id, who, time, scope }) => ({ cause: id, who, time, scope })),
    });
  }

  protected addDuringReflect(): void {
    const pick = this.pick();
    if (!pick || this.full()) return;
    this.store.causes.update((cs) => [...cs, { ...pick, ...this.draft() }]);
    this.added.update((n) => n + 1);
    this.pick.set(null);
    this.draft.set({ ...MIDDLE });
  }

  protected submitReflect(): void {
    const added = this.store.causes().slice(this.store.causes().length - this.added());
    this.done({
      shown: this.shown(),
      added: added.map(({ id, who, time, scope }) => ({ cause: id, who, time, scope })),
    });
  }

  protected finish(): void {
    const chosen = this.chosen();
    const cause = chosen && chosen !== 'none' ? chosen : null;
    this.completed.emit({
      result: { chosen: cause ? { cause: cause.id, who: cause.who, time: cause.time, scope: cause.scope } : null },
      next: cause ? { label: this.c.change.plan_link, exercise: 'action_bridge' } : undefined,
    });
  }
}
