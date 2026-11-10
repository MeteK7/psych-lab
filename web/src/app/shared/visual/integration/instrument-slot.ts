import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, input, signal } from '@angular/core';

import type { InstrumentName } from './instruments';

/** Each instrument's design ratio, so its space is held before it loads. */
const RATIOS: Record<InstrumentName, string> = {
  'cause-map': '416 / 284',
  rounds: '480 / 16',
  'tracking-preview': '480 / 200',
};

/**
 * S9 Integration: where an exercise shows an instrument (docs/visual-system.md §7, tier 2). The
 * instruments and the renderer load on demand, in their own chunk (§3.4 rule 8), so the exercise
 * carries only this slot. It holds the instrument's space meanwhile, and keeps holding it if
 * loading fails: an exercise always says the same in words, so a step never depends on a picture.
 */
@Component({
  selector: 'app-vis-instrument-slot',
  imports: [NgComponentOutlet],
  template: `
    @if (component(); as figure) {
      <ng-container *ngComponentOutlet="figure; inputs: { instrument: instrument(), inputs: inputs() }" />
    } @else {
      <div [style.aspect-ratio]="ratio()"></div>
    }
  `,
  styles: `:host { display: block; }`,
})
export class InstrumentSlot {
  readonly instrument = input.required<InstrumentName>();
  /** The instrument's inputs: numbers, places and the exercise's own words, never the person's. */
  readonly inputs = input.required<Record<string, unknown>>();

  protected readonly component = signal<Type<unknown> | null>(null);
  protected readonly ratio = computed(() => RATIOS[this.instrument()]);

  constructor() {
    void import('./instruments').then(
      ({ InstrumentFigure }) => this.component.set(InstrumentFigure),
      () => undefined,
    );
  }
}
