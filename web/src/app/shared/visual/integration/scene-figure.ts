import { Component, computed, input } from '@angular/core';

import { SceneDefinition, StateName, TextLookup } from '../composition/scene';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';
import { buildFrame } from './pipeline';

export type { SurfaceScheme };

/**
 * S9 Integration: a scene in a given state, drawn by the SVG backend. The only place outside the
 * rendering folder that names a backend. It carries no text alternative itself: the visual slot
 * (or the Visual Lab) wraps it in a figure with the scene's alt text for the state.
 */
@Component({
  selector: 'app-vis-scene',
  imports: [SvgBackend],
  template: `<app-vis-svg [frame]="frame()" [scheme]="scheme()" />`,
  styles: `:host { display: block; }`,
})
export class SceneFigure {
  readonly scene = input.required<SceneDefinition>();
  readonly state = input.required<StateName>();
  readonly text = input.required<TextLookup>();
  readonly scheme = input<SurfaceScheme>('auto');

  protected readonly frame = computed(() => buildFrame(this.scene(), this.state(), this.text()));
}
