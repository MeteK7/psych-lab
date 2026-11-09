import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, effect, input, signal } from '@angular/core';

/**
 * S9 Integration: where an exercise shows an instrument (docs/visual-system.md §7, tier 2). The
 * instrument and the renderer load on demand, in their own chunk (§3.4 rule 8), so the exercise
 * carries only this slot. It holds the instrument's space meanwhile, and keeps holding it if
 * loading fails: an exercise always says the same in words, so a step never depends on a picture.
 */
const INSTRUMENTS = {
  /** The CS2 cause map: `{ causes, placing, axes }` (instruments/cause-map). */
  'cause-map': { ratio: '416 / 284', load: () => import('./cause-map').then((m) => m.CauseMap as Type<unknown>) },
  /** The dot game's rounds: `{ total, current }` (instruments/rounds). */
  rounds: { ratio: '480 / 16', load: () => import('./rounds').then((m) => m.Rounds as Type<unknown>) },
} as const;

export type InstrumentName = keyof typeof INSTRUMENTS;

@Component({
  selector: 'app-vis-instrument-slot',
  imports: [NgComponentOutlet],
  template: `
    @if (component(); as instrument) {
      <ng-container *ngComponentOutlet="instrument; inputs: inputs()" />
    } @else {
      <div [style.aspect-ratio]="ratio()"></div>
    }
  `,
  styles: `:host { display: block; }`,
})
export class InstrumentSlot {
  readonly instrument = input.required<InstrumentName>();
  /** The instrument's inputs: numbers and places only, never the person's words. */
  readonly inputs = input.required<Record<string, unknown>>();

  protected readonly component = signal<Type<unknown> | null>(null);
  protected readonly ratio = computed(() => INSTRUMENTS[this.instrument()].ratio);

  constructor() {
    effect(() => {
      INSTRUMENTS[this.instrument()].load().then(
        (component) => this.component.set(component),
        () => undefined,
      );
    });
  }
}
