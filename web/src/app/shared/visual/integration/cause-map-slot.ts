import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, input, signal } from '@angular/core';

import type { CauseMapInput } from '../instruments/cause-map/cause-map';

/**
 * S9 Integration: where an exercise shows the CS2 cause map. The instrument and the renderer load
 * on demand, in their own chunk (docs/visual-system.md §3.4 rule 8), so the exercise carries only
 * this slot. It holds the map's space meanwhile, and keeps holding it if loading fails: the list
 * under the map gives the same answers in words, so a step never depends on the picture.
 */
@Component({
  selector: 'app-vis-cause-map-slot',
  imports: [NgComponentOutlet],
  template: `
    @if (component(); as map) {
      <ng-container *ngComponentOutlet="map; inputs: inputs()" />
    } @else {
      <div class="space"></div>
    }
  `,
  styles: `
    :host { display: block; }
    .space { aspect-ratio: 416 / 284; }
  `,
})
export class CauseMapSlot {
  /** Each cause's answers on the two charted scales (1–5), in list order. Places only, no texts. */
  readonly causes = input.required<CauseMapInput['causes']>();
  /** The 1-based number of the cause being placed, or 0. */
  readonly placing = input(0);
  readonly axes = input.required<CauseMapInput['axes']>();

  protected readonly component = signal<Type<unknown> | null>(null);
  protected readonly inputs = computed(() => ({ causes: this.causes(), placing: this.placing(), axes: this.axes() }));

  constructor() {
    void import('./cause-map').then(
      ({ CauseMap }) => this.component.set(CauseMap),
      () => undefined,
    );
  }
}
