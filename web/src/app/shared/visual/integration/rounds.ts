import { Component, computed, input } from '@angular/core';

import { roundsFrame } from '../instruments/rounds/rounds';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';

/** S9 Integration: the dot game's rounds (instruments/rounds). Decorative for assistive technology: the text says the round. */
@Component({
  selector: 'app-vis-rounds',
  imports: [SvgBackend],
  template: `<app-vis-svg [frame]="frame()" [scheme]="scheme()" />`,
  styles: `:host { display: block; }`,
})
export class Rounds {
  readonly total = input.required<number>();
  readonly current = input.required<number>();
  /** Pinned in the Visual Lab; follows the page elsewhere. */
  readonly scheme = input<SurfaceScheme>('auto');

  protected readonly frame = computed(() => roundsFrame({ total: this.total(), current: this.current() }));
}
