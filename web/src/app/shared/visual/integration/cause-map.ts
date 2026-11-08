import { Component, computed, input } from '@angular/core';

import { CauseMapInput, causeMapFrame } from '../instruments/cause-map/cause-map';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';

/**
 * S9 Integration: the CS2 cause map as an instrument component (docs/visual-system.md §7, tier 2).
 * The exercise keeps its native controls (the sliders) and the text list; this draws the map from
 * the answers. It carries no text alternative itself: the exercise gives it one, next to the list.
 */
@Component({
  selector: 'app-vis-cause-map',
  imports: [SvgBackend],
  template: `<app-vis-svg [frame]="frame()" [scheme]="scheme()" />`,
  styles: `:host { display: block; }`,
})
export class CauseMap {
  /** Each cause's answers on the two charted scales (1–5), in list order. Places only, no texts. */
  readonly causes = input.required<CauseMapInput['causes']>();
  /** The 1-based number of the cause being placed, or 0. */
  readonly placing = input(0);
  readonly axes = input.required<CauseMapInput['axes']>();
  readonly scheme = input<SurfaceScheme>('auto');

  protected readonly frame = computed(() => causeMapFrame({ causes: this.causes(), placing: this.placing(), axes: this.axes() }));
}
