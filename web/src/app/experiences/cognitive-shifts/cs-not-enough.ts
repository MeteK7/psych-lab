import { Component, computed, inject, input, output, signal } from '@angular/core';

import { CS_NOT_ENOUGH, fill } from '../../../content';
import { StepId } from '../../flow/conditions';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { CardPick } from './card-pick';
import { pointsLeft, shareComplete } from './cs-logic';
import { CsStore, Pick } from './cs-store';

interface Row {
  key: string;
  card: string;
  text: string;
  first: boolean;
}

const SOMETHING_ELSE = 'something_else';

/**
 * CS3 · Not enough to go on (cognitive-shifts-design.md §5): readings of an unclear situation
 * compete for 10 points, then the person decides whether and how to find out. Own texts stay
 * in CsStore.
 */
@Component({
  selector: 'app-cs-not-enough',
  imports: [CardPick, RatingScale],
  template: `
    @switch (stage()) {
      @case ('cs3_situation') {
        <p class="safety">{{ c.safety }}</p>
        <fieldset class="choice">
          <legend>{{ c.situation.ask }}</legend>
          @for (scenario of c.situation.scenarios; track scenario.id) {
            <label class="option" [class.chosen]="choice() === scenario.id">
              <input type="radio" name="cs3-situation" [checked]="choice() === scenario.id" (change)="choice.set(scenario.id)" />
              <span>{{ scenario.text }}</span>
            </label>
          }
          <label class="option" [class.chosen]="choice() === 'own'">
            <input type="radio" name="cs3-situation" [checked]="choice() === 'own'" (change)="choice.set('own')" />
            <span>{{ c.situation.own_choice }}</span>
          </label>
        </fieldset>
        @if (choice() === 'own') {
          <label class="field">
            <span>{{ c.situation.own_label }}</span>
            <input type="text" maxlength="120" [value]="ownSituation()" (input)="ownSituation.set(value($event))" />
          </label>
        }
        <button type="button" [disabled]="!choice() || (choice() === 'own' && !ownSituation().trim())" (click)="submitSituation()">
          {{ c.next_label }}
        </button>
      }
      @case ('cs3_first') {
        <p class="quote">{{ store.scenario()?.text }}</p>
        <app-card-pick [legend]="readings().length ? c.first.ask : c.first.ask_own" [cards]="readings()" [ownChoice]="c.first.own_choice"
                       [ownLabel]="c.first.own_label" [(value)]="pick" />
        <app-rating-scale [item]="c.first.certainty" [(value)]="certainty" />
        <button type="button" [disabled]="!pick() || certainty() === null" (click)="submitFirst()">{{ c.next_label }}</button>
      }
      @case ('cs3_share') {
        <p class="quote">{{ store.scenario()?.text }}</p>
        <p>{{ c.share.intro }}</p>
        @if (readings().length) {
          <fieldset class="choice">
            <legend>{{ c.share.choose }}</legend>
            @for (reading of otherCards(); track reading.id) {
              <label class="check">
                <input type="checkbox" [checked]="chosen(reading.id)" (change)="toggleOther(reading)" />
                {{ reading.text }}
              </label>
            }
          </fieldset>
        }
        <form class="own" (submit)="$event.preventDefault(); addOwn()">
          <label class="field">
            <span>{{ c.share.own_label }}</span>
            <input type="text" maxlength="120" [value]="ownText()" (input)="ownText.set(value($event))" />
          </label>
          <button type="submit" [disabled]="!ownText().trim()">{{ c.share.add }}</button>
        </form>

        <ul class="rows">
          @for (row of rows(); track row.key) {
            <li class="row">
              <span class="label">
                {{ row.text }}
                @if (row.first) {
                  <span class="tag">({{ c.share.first_tag }})</span>
                }
                <span class="bar" [style.width.%]="(store.points()[row.key] ?? 0) * 10" aria-hidden="true"></span>
              </span>
              <span class="stepper">
                <button type="button" [attr.aria-label]="say(c.share.fewer, { reading: row.text })"
                        [disabled]="!(store.points()[row.key] ?? 0)" (click)="adjust(row.key, -1)">−</button>
                <span class="value">{{ store.points()[row.key] ?? 0 }}</span>
                <button type="button" [attr.aria-label]="say(c.share.more, { reading: row.text })"
                        [disabled]="left() === 0" (click)="adjust(row.key, 1)">+</button>
              </span>
            </li>
          }
        </ul>
        <p role="status">{{ say(c.share.left, { n: left() }) }}</p>
        <div class="actions">
          <button type="button" [attr.aria-pressed]="store.cs3NoneFit()" (click)="store.cs3NoneFit.set(!store.cs3NoneFit())">
            {{ c.share.none_fit }}
          </button>
          <button type="button" [disabled]="!canShare()" (click)="submitShare()">{{ c.next_label }}</button>
        </div>
      }
      @case ('cs3_find') {
        <p>{{ c.find.intro }}</p>
        <fieldset class="choice">
          <legend class="sr-only">{{ c.find.intro }}</legend>
          @for (option of c.find.options; track option.id) {
            <label class="check">
              <input type="radio" name="cs3-find" [checked]="find() === option.id" (change)="find.set(option.id)" />
              {{ option.label }}
            </label>
          }
        </fieldset>
        <button type="button" [disabled]="!find()" (click)="done({ choice: find() })">{{ c.next_label }}</button>
      }
      @case ('cs3_after') {
        <p class="quote">{{ say(c.after.reading, { reading: store.cs3First()?.text ?? '' }) }}</p>
        <app-rating-scale [item]="c.first.certainty" [(value)]="certainty" />
        <p class="note">{{ c.after.close }}</p>
        <button type="button" [disabled]="certainty() === null" (click)="finish()">{{ c.finish_label }}</button>
      }
    }
  `,
  styles: `
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .quote { font-size: 1.1rem; }
    .choice { border: 0; padding: 0; margin: 0 0 1rem; }
    .choice legend { font-weight: 600; margin-bottom: 0.5rem; }
    .option { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem;
              border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
    .option.chosen { border-color: var(--accent); border-width: 2px; padding: calc(0.6rem - 1px) calc(0.75rem - 1px); }
    .option input { margin-top: 0.25rem; }
    .check { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.4rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; max-width: 32rem; }
    .field input { padding: 0.4rem; font: inherit; }
    .own { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    .rows { list-style: none; padding: 0; margin: 1rem 0 0.5rem; display: grid; gap: 0.6rem; max-width: 36rem; }
    .row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.75rem; align-items: center; }
    .label { display: flex; flex-direction: column; gap: 0.25rem; }
    .tag { color: var(--muted); font-size: 0.875rem; }
    .bar { display: block; height: 6px; border-radius: 3px; background: var(--accent); }
    .stepper { display: inline-flex; align-items: center; gap: 0.4rem; }
    .stepper button { min-width: 2rem; }
    .value { min-width: 1.5rem; text-align: center; font-variant-numeric: tabular-nums; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .note { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class CsNotEnough implements Experience {
  readonly stage = input.required<StepId>();
  readonly completed = output<StepOutcome>();

  protected readonly c = CS_NOT_ENOUGH;
  protected readonly store = inject(CsStore);

  protected readonly choice = signal<string | null>(null);
  protected readonly ownSituation = signal('');
  protected readonly pick = signal<Pick | null>(null);
  protected readonly certainty = signal<number | null>(null);
  protected readonly ownText = signal('');
  protected readonly find = signal<string | null>(null);

  /** The chosen scenario's readings; none for an own situation. */
  protected readonly readings = computed(
    () => this.c.situation.scenarios.find((s) => s.id === this.store.scenario()?.id)?.readings ?? [],
  );
  protected readonly otherCards = computed(() => this.readings().filter((r) => r.id !== this.store.cs3First()?.id));
  protected readonly rows = computed<Row[]>(() => {
    const first = this.store.cs3First();
    const rows: Row[] = first ? [{ key: 'first', card: first.id, text: first.text, first: true }] : [];
    this.store.others().forEach((o, i) => rows.push({ key: `other-${i}`, card: o.id, text: o.text, first: false }));
    rows.push({ key: SOMETHING_ELSE, card: SOMETHING_ELSE, text: this.c.share.something_else, first: false });
    return rows;
  });
  protected readonly left = computed(() => pointsLeft(this.store.points()));
  /** The first reading plus at least two others (not counting "something else"). */
  protected readonly canShare = computed(
    () => this.store.cs3NoneFit() || shareComplete(this.store.points(), this.rows().length - 1),
  );

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected say(text: string, values: Record<string, string | number>): string {
    return fill(text, values);
  }

  protected chosen(id: string): boolean {
    return this.store.others().some((o) => o.id === id);
  }

  protected done(result: Record<string, unknown>): void {
    this.completed.emit({ result });
  }

  protected submitSituation(): void {
    const id = this.choice();
    if (!id) return;
    const scenario = this.c.situation.scenarios.find((s) => s.id === id);
    this.store.scenario.set(scenario ? { id, text: scenario.text } : { id: 'own', text: this.ownSituation().trim() });
    this.done({ scenario: scenario ? id : 'own' });
  }

  protected submitFirst(): void {
    const pick = this.pick();
    if (!pick) return;
    this.store.cs3First.set(pick);
    this.completed.emit({ result: { first: pick.id }, ratings: { cs3_certainty_pre: this.certainty()! } });
  }

  protected toggleOther(reading: Pick): void {
    if (this.chosen(reading.id)) {
      const index = this.store.others().findIndex((o) => o.id === reading.id);
      this.store.others.update((os) => os.filter((o) => o.id !== reading.id));
      this.dropPoints(index);
    } else {
      this.store.others.update((os) => [...os, { id: reading.id, text: reading.text }]);
    }
  }

  protected addOwn(): void {
    const text = this.ownText().trim();
    if (!text) return;
    this.store.others.update((os) => [...os, { id: 'own', text }]);
    this.ownText.set('');
  }

  protected adjust(key: string, by: number): void {
    const now = this.store.points()[key] ?? 0;
    const next = now + by;
    if (next < 0 || (by > 0 && this.left() === 0)) return;
    this.store.points.update((p) => ({ ...p, [key]: next }));
  }

  /** Removing a reading frees its points and shifts later rows' points to their new keys. */
  private dropPoints(index: number): void {
    this.store.points.update((p) => {
      const out: Record<string, number> = {};
      for (const [key, n] of Object.entries(p)) {
        const m = /^other-(\d+)$/.exec(key);
        if (!m) out[key] = n;
        else if (Number(m[1]) < index) out[key] = n;
        else if (Number(m[1]) > index) out[`other-${Number(m[1]) - 1}`] = n;
      }
      return out;
    });
  }

  protected submitShare(): void {
    this.done({
      readings: this.rows().map((r) => ({ reading: r.key, card: r.card, points: this.store.points()[r.key] ?? 0 })),
      none_fit: this.store.cs3NoneFit(),
    });
  }

  protected finish(): void {
    this.completed.emit({ result: {}, ratings: { cs3_certainty_post: this.certainty()! } });
  }
}
