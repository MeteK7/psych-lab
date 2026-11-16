import { Component, ComponentRef, ViewContainerRef, computed, effect, input, output, signal, viewChild } from '@angular/core';

import type { ViewpointFigure, ViewpointInstrument } from './viewpoint-figure';

/** Each spatial view's design ratio, so its space is held before it loads. */
const RATIOS: Record<ViewpointInstrument, string> = { room: '960 / 540' };

/**
 * S9 Integration: where an exercise shows a spatial view that the person moves (the viewpoint
 * figure, `viewpoint-figure.ts`). As the instrument slot does, it loads the figure, its instrument
 * and the renderer on demand in their own chunk, and holds the figure's space meanwhile (and if
 * loading fails: the exercise's native slider and words carry the step on their own).
 *
 * The exercise holds the position; a drag that settles on a position is passed on, so its slider
 * follows. Once loaded, it reports what was drawn, for the step's `visual_source`.
 */
@Component({
  selector: 'app-vis-viewpoint-slot',
  template: `
    <ng-container #outlet />
    @if (!loaded()) {
      <div [style.aspect-ratio]="ratio()"></div>
    }
  `,
  styles: `:host { display: block; }`,
})
export class ViewpointSlot {
  readonly instrument = input.required<ViewpointInstrument>();
  /** The instrument's inputs, without the viewpoint: the exercise's own words, never the person's. */
  readonly inputs = input.required<Record<string, unknown>>();
  readonly position = input.required<number>();
  readonly positions = input(4);
  /** A drag that settled on a position. */
  readonly positionChange = output<number>();
  /** What the figure draws (`instrument:<id>@<version>;theme:<theme>@<version>`), once it has loaded. */
  readonly drawn = output<string>();

  protected readonly ratio = computed(() => RATIOS[this.instrument()]);
  protected readonly loaded = signal(false);
  private readonly outlet = viewChild.required('outlet', { read: ViewContainerRef });
  private readonly figure = signal<ComponentRef<ViewpointFigure> | null>(null);

  constructor() {
    void Promise.all([import('./viewpoint-figure'), import('./instruments')]).then(
      ([{ ViewpointFigure }, { composeInstrument, instrumentSourceId }]) => {
        const ref = this.outlet().createComponent(ViewpointFigure);
        ref.instance.positionChange.subscribe((p) => this.positionChange.emit(p));
        this.figure.set(ref);
        this.loaded.set(true);
        this.drawn.emit(instrumentSourceId(composeInstrument(this.instrument(), { ...this.inputs(), view: this.position() })));
      },
      () => undefined,
    );
    // Inputs reach the figure as they change, including the position the exercise holds.
    effect(() => {
      const ref = this.figure();
      if (!ref) return;
      ref.setInput('instrument', this.instrument());
      ref.setInput('inputs', this.inputs());
      ref.setInput('positions', this.positions());
      ref.setInput('position', this.position());
    });
  }
}
