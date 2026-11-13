import { Component, Signal, WritableSignal, computed, input, signal } from '@angular/core';

import { Composed, SHOWN, lookupOf } from '../../shared/visual/composition/compose';
import { Hit, TargetArea, hitTest, placeAt, targetsOf, toScenePoint } from '../../shared/visual/interaction/regions';
import { ControlledBy, InteractiveFigure, Values } from '../../shared/visual/integration/interactive-figure';
import { SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { frameSize } from '../../shared/visual/styling/vocabulary';
import { CHOICES, choiceFigure, fieldFigure, ratingFigure } from './lab-interaction-figures';
import { LabNativeControls } from './lab-native-controls';

type Shapes = { kind: 'box' | 'band' | 'outline'; d: string; width?: number }[];

interface Reference {
  id: string;
  name: string;
  about: string;
  /** The reference's values, shared by its light and dark panels and its native controls. */
  values: WritableSignal<Values>;
  composed: Signal<Composed>;
  targets: Signal<TargetArea[]>;
  /** The overlay: each target's least area (small ones), lines' reach, and outlines. */
  shapes: Signal<Shapes>;
}

function overlay(targets: TargetArea[]): Shapes {
  return targets.flatMap((t) => {
    const d = t.outline.map((l) => `M${l.points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}${l.closed ? ' Z' : ''}`).join(' ');
    const open = t.outline.every((l) => !l.closed);
    const shapes: Shapes = [open ? { kind: 'band', d, width: 2 * t.reach } : { kind: 'outline', d }];
    if (t.small) shapes.push({ kind: 'box', d: `M${t.area.x} ${t.area.y} h${t.area.width} v${t.area.height} h${-t.area.width} Z` });
    return shapes;
  });
}

function reference(id: string, name: string, about: string, compose: (v: Values) => Composed, start: Values): Reference {
  const values = signal<Values>(start);
  const composed = computed(() => compose(values()));
  const targets = computed(() => targetsOf(composed().scene, SHOWN));
  return { id, name, about, values, composed, targets, shapes: computed(() => overlay(targets())) };
}

/**
 * The Visual Lab's interaction section (milestone M4): reference figures with their targets. Under
 * the pointer, which target it's on and the value a handle would take there. Every reference is
 * live, with one value shared by its light and dark panels. Either the figure is itself the control
 * (sliders and a radio group in the figure), or native controls beside it hold the same values and
 * the figures take the pointer only, as an exercise chooses.
 */
@Component({
  selector: 'app-lab-interaction',
  imports: [InteractiveFigure, LabNativeControls],
  styleUrls: ['./lab.css'],
  styles: `
    .stage { position: relative; }
    .options { display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem; }
    .targets { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
    .targets path { fill: none; stroke: var(--accent); vector-effect: non-scaling-stroke; }
    .targets .outline { stroke-dasharray: 4 3; }
    .targets .box { stroke-dasharray: 2 3; }
    .targets .band { stroke-opacity: 0.18; stroke-linecap: round; vector-effect: none; }
    .under { font-size: 0.85rem; min-height: 1.4em; margin: 0.3rem 0 0; }
    @media (forced-colors: active) { .targets path { stroke: Highlight; } }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-interaction">
      <h2 id="lab-interaction">Interaction<span class="meta"> · S6 · M4 · reference compositions</span></h2>
      <p class="note muted">
        Figures that take a pointer: a handle moves along one scale or two, a click on its track places it there, and a region is
        chosen as a whole. Values are always the exercise's own: snapped to the scale's steps and held at its ends. Small targets
        count 24 × 24 units around their centre.
      </p>
      <ul class="notes muted">
        <li>Drag a mark, or press its line or field. Escape while dragging puts the value back.</li>
        <li>Without dragging: click the mark to pick it up (its line gets heavier), then click where it should go. Escape, or a click on it again, puts it down.</li>
        <li>With the keyboard: Tab to a mark, then the arrow keys step, Page Up and Page Down jump, Home and End go to the ends. The field has one stop per axis. The options are a radio group: Tab to it, then the arrows choose.</li>
        <li>Click an option to choose it.</li>
      </ul>
      <div class="options">
        <label class="tier">Keyboard and screen readers use
          <select [value]="controlledBy()" (change)="controlledBy.set($any($event.target).value)">
            <option value="figure">The figure itself</option>
            <option value="native">Native controls beside it (the figure takes the pointer only)</option>
          </select>
        </label>
        <label class="tier"><input type="checkbox" [checked]="showTargets()" (change)="showTargets.set($any($event.target).checked)" /> Show targets</label>
      </div>
      @for (ref of references; track ref.id) {
        <h3>{{ ref.name }}</h3>
        <p class="note">{{ ref.about }}</p>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ ref.composed().scene.id }} · {{ scheme }}</span>
              <div class="stage" (pointermove)="point(ref, $event)" (pointerleave)="leave(ref)">
                <app-vis-interactive [composed]="ref.composed()" [values]="ref.values()" (valuesChange)="ref.values.set($event)" [scheme]="scheme"
                                     [controlledBy]="controlledBy()" [attr.data-interaction]="ref.id + '-' + scheme" />
                @if (showTargets()) {
                  <svg class="targets" [attr.viewBox]="viewBox(ref)" aria-hidden="true">
                    @for (s of ref.shapes(); track $index) {
                      <path [class]="s.kind" [attr.d]="s.d" [style.stroke-width]="s.width ? s.width : null" />
                    }
                  </svg>
                }
              </div>
            </div>
          }
        </div>
        @if (controlledBy() === 'native') {
          <app-lab-native-controls [composed]="ref.composed()" [values]="ref.values()" (valuesChange)="ref.values.set($event)" />
        }
        <p class="under" [attr.data-value]="ref.id"><span class="muted">Value:</span> {{ valueText(ref.values()) }}</p>
        <p class="under" [attr.data-under]="ref.id">
          <span class="muted">Under the pointer:</span> {{ under()[ref.id] ?? 'nothing' }}
        </p>
      }
    </section>
  `,
})
export class LabInteraction {
  readonly schemes = input.required<SurfaceScheme[]>();
  protected readonly showTargets = signal(true);
  protected readonly controlledBy = signal<ControlledBy>('figure');
  protected readonly under = signal<Record<string, string>>({});
  protected readonly references: Reference[] = [
    reference(
      'rating',
      'A mark on a scale from 1 to 5',
      'Drag the mark, or press the line: the mark takes the nearest whole value.',
      (v) => ratingFigure(Number(v['rating'])),
      { rating: 3 },
    ),
    reference(
      'field',
      'A mark in a field with two axes',
      'Like the cause map: each axis has its own scale; pressing in the field places the mark.',
      (v) => fieldFigure(Number(v['across']), Number(v['up'])),
      { across: 2, up: 4 },
    ),
    reference(
      'choice',
      'One of three options',
      'Each option is a region, chosen as a whole.',
      (v) => choiceFigure(v['choice'] as (typeof CHOICES)[number]),
      { choice: 'second' },
    ),
  ];

  protected valueText(values: Values): string {
    return Object.entries(values)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');
  }

  protected viewBox(ref: Reference): string {
    const { width, height } = frameSize(ref.composed().scene.frame);
    return `0 0 ${width} ${height}`;
  }

  protected leave(ref: Reference): void {
    this.under.update((u) => ({ ...u, [ref.id]: 'nothing' }));
  }

  /** What's under the pointer, in words: the target, and the value a handle would take there. */
  protected point(ref: Reference, event: PointerEvent): void {
    const svg = (event.currentTarget as HTMLElement).querySelector('app-vis-svg svg');
    if (!svg) return;
    const p = toScenePoint({ x: event.clientX, y: event.clientY }, svg.getBoundingClientRect(), frameSize(ref.composed().scene.frame));
    this.under.update((u) => ({ ...u, [ref.id]: this.describe(ref, hitTest(ref.targets(), p), p) }));
  }

  private describe(ref: Reference, hit: Hit | null, p: readonly [number, number]): string {
    if (!hit) return 'nothing';
    const composed = ref.composed();
    const words = lookupOf(composed)(hit.target.label) ?? '';
    if (hit.kind === 'region') return `region '${hit.id}' (${words}): ${hit.target.value} = ${hit.target.option}`;
    const values = Object.entries(placeAt(composed.scene, hit.target, p))
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');
    return hit.kind === 'handle' ? `handle '${hit.id}' (${words})` : `track '${hit.id}' of '${hit.handle}': a click places it at ${values}`;
  }
}
