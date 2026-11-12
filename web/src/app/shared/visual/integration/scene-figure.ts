import { Component, computed, input, linkedSignal, untracked } from '@angular/core';

import { SceneDefinition, StateName, TextLookup } from '../composition/scene';
import { QualityTier } from '../motion/plan-motion';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';
import { buildChangeTimeline, buildFrame, buildTimeline } from './pipeline';
import { reducedMotion } from './reduced-motion';

export type { QualityTier, SurfaceScheme };

interface Shown {
  scene: SceneDefinition;
  state: StateName;
}


/**
 * S9 Integration: a scene in a given state, drawn by the SVG backend. The only place outside the
 * rendering folder that names a backend. It carries no text alternative itself: the visual slot
 * (or the Visual Lab) wraps it in a figure with the scene's alt text for the state.
 *
 * Motion: when `state` changes, the change from the previous state plays (S5). On the first
 * appearance nothing moves, unless `from` names the state the person has just seen (a step that
 * creates a new figure). When a figure built from data is drawn again from new data (the same
 * figure id, the same state), the change between the two plays: what `moves` glides, what is new
 * enters (M5). `tier` defaults to the person's setting: reduced motion shows the final state at once.
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
  /** What is drawn: changes only when the scene or the state does (new words alone play nothing). */
  private readonly shown = computed(() => ({ scene: this.scene(), state: this.state() }), {
    equal: (a, b) => a.scene === b.scene && a.state === b.state,
  });
  private readonly change = linkedSignal<Shown, { before: Shown | null; now: Shown }>({
    source: this.shown,
    computation: (now, previous) => ({ before: previous ? previous.source : null, now }),
  });
  private readonly effectiveTier = computed<QualityTier>(() => {
    const tier = this.tier();
    return tier !== 'auto' ? tier : this.reduce() ? 'reduced' : 'full';
  });

  protected readonly frame = computed(() => buildFrame(this.scene(), this.state(), this.text()));
  protected readonly timeline = computed(() => {
    const { before, now } = this.change();
    const tier = this.effectiveTier();
    if (before && before.state === now.state) return buildChangeTimeline(before.scene, now.scene, now.state, untracked(this.text), tier);
    return buildTimeline(now.scene, before ? before.state : untracked(this.from), now.state, tier, untracked(this.text));
  });
}
