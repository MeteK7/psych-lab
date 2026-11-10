import { Component, computed, input } from '@angular/core';

import { Composed, SHOWN, lookupOf } from '../composition/compose';
import { CauseMapInput, composeCauseMap } from '../instruments/cause-map/cause-map';
import { RoundsInput, composeRounds } from '../instruments/rounds/rounds';
import { PreviewInput, composeTrackingPreview } from '../instruments/tracking/tracking';
import { SceneFigure, SurfaceScheme } from './scene-figure';

/**
 * S9 Integration: every instrument by name, and the one figure that draws them (milestone M1).
 * An instrument is a composition built from data; it is drawn by the same scene figure as every
 * scene, through the same pipeline. Adding an instrument is one line here.
 */
export const INSTRUMENTS = {
  /** The CS2 cause map (instruments/cause-map). */
  'cause-map': (inputs: CauseMapInput) => composeCauseMap(inputs),
  /** The dot game's rounds (instruments/rounds). */
  rounds: (inputs: RoundsInput) => composeRounds(inputs),
  /** "How the game works", the dot game's preview (instruments/tracking). */
  'tracking-preview': (inputs: PreviewInput) => composeTrackingPreview(inputs),
} as const;

export type InstrumentName = keyof typeof INSTRUMENTS;

export function composeInstrument(name: InstrumentName, inputs: Record<string, unknown>): Composed {
  return (INSTRUMENTS[name] as (inputs: unknown) => Composed)(inputs);
}

/**
 * An instrument, drawn. It carries no text alternative itself: the exercise (or the Visual Lab)
 * gives one, next to the words that say the same.
 */
@Component({
  selector: 'app-vis-instrument',
  imports: [SceneFigure],
  template: `<app-vis-scene [scene]="composed().scene" [state]="shown" [text]="text()" [scheme]="scheme()" />`,
  styles: `:host { display: block; }`,
})
export class InstrumentFigure {
  readonly instrument = input.required<InstrumentName>();
  /** The instrument's inputs: numbers, places and the exercise's own words, never the person's. */
  readonly inputs = input.required<Record<string, unknown>>();
  /** Pinned in the Visual Lab; follows the page elsewhere. */
  readonly scheme = input<SurfaceScheme>('auto');

  protected readonly shown = SHOWN;
  protected readonly composed = computed(() => composeInstrument(this.instrument(), this.inputs()));
  protected readonly text = computed(() => lookupOf(this.composed()));
}
