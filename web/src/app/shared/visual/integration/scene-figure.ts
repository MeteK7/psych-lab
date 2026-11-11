import { Component, computed, input, linkedSignal, signal, untracked } from '@angular/core';

import { SceneDefinition, StateName, TextLookup } from '../composition/scene';
import { QualityTier } from '../motion/plan-motion';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';
import { buildFrame, buildTimeline } from './pipeline';

export type { QualityTier, SurfaceScheme };

const REDUCE = '(prefers-reduced-motion: reduce)';

/** The person's motion preference, kept current while the page is open. */
function reducedMotion() {
  const query = typeof matchMedia === 'function' ? matchMedia(REDUCE) : null;
  const reduce = signal(query?.matches ?? false);
  query?.addEventListener?.('change', (e) => reduce.set(e.matches));
  return reduce.asReadonly();
}

/**
 * S9 Integration: a scene in a given state, drawn by the SVG backend. The only place outside the
 * rendering folder that names a backend. It carries no text alternative itself: the visual slot
 * (or the Visual Lab) wraps it in a figure with the scene's alt text for the state.
 *
 * Motion: when `state` changes, the change from the previous state plays (S5). On the first
 * appearance nothing moves, unless `from` names the state the person has just seen (a step that
 * creates a new figure). `tier` defaults to the person's setting: reduced motion shows the final
 * state at once.
 */
@Component({
  selector: 'app-vis-scene',
  imports: [SvgBackend],
  template: `<app-vis-svg [frame]="frame()" [timeline]="timeline()" [scheme]="scheme()" />`,
  styles: `:host { display: block; }`,
})
export class SceneFigure {
  readonly scene = input.required<SceneDefinition>();
  readonly state = input.required<StateName>();
  readonly text = input.required<TextLookup>();
  readonly scheme = input<SurfaceScheme>('auto');
  /** The state shown just before this figure appeared, if any. */
  readonly from = input<StateName | null>(null);
  readonly tier = input<QualityTier | 'auto'>('auto');

  private readonly reduce = reducedMotion();
  private readonly change = linkedSignal<StateName, { from: StateName | null; to: StateName }>({
    source: this.state,
    computation: (to, previous) => ({ from: previous ? previous.source : untracked(this.from), to }),
  });
  private readonly effectiveTier = computed<QualityTier>(() => {
    const tier = this.tier();
    return tier !== 'auto' ? tier : this.reduce() ? 'reduced' : 'full';
  });

  protected readonly frame = computed(() => buildFrame(this.scene(), this.state(), this.text()));
  protected readonly timeline = computed(() => {
    const { from, to } = this.change();
    return buildTimeline(this.scene(), from, to, this.effectiveTier());
  });
}
