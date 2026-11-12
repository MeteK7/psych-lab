import { Component, input, signal } from '@angular/core';

import { Composed, SHOWN, lookupOf } from '../../shared/visual/composition/compose';
import { TextLookup } from '../../shared/visual/composition/scene';
import { Hit, TargetArea, hitTest, placeAt, targetsOf, toScenePoint } from '../../shared/visual/interaction/regions';
import { SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { frameSize } from '../../shared/visual/styling/vocabulary';
import { choiceFigure, fieldFigure, ratingFigure } from './lab-interaction-figures';

interface Reference {
  id: string;
  name: string;
  about: string;
  composed: Composed;
  targets: TargetArea[];
  /** The overlay: each target's least area (small ones), lines' reach, and outlines. */
  shapes: { kind: 'box' | 'band' | 'outline'; d: string; width?: number }[];
}

function overlay(targets: TargetArea[]): Reference['shapes'] {
  return targets.flatMap((t) => {
    const d = t.outline.map((l) => `M${l.points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}${l.closed ? ' Z' : ''}`).join(' ');
    const open = t.outline.every((l) => !l.closed);
    const shapes: Reference['shapes'] = [open ? { kind: 'band', d, width: 2 * t.reach } : { kind: 'outline', d }];
    if (t.small) shapes.push({ kind: 'box', d: `M${t.area.x} ${t.area.y} h${t.area.width} v${t.area.height} h${-t.area.width} Z` });
    return shapes;
  });
}

function reference(id: string, name: string, about: string, composed: Composed): Reference {
  const targets = targetsOf(composed.scene, SHOWN);
  return { id, name, about, composed, targets, shapes: overlay(targets) };
}

/**
 * The Visual Lab's interaction section (milestone M4): reference figures with their targets. Stage
 * A shows what S6 knows about each figure: where its targets are (least areas, the reach of a
 * line), and, under the pointer, which target it's on and the value a handle would take there.
 */
@Component({
  selector: 'app-lab-interaction',
  imports: [SceneFigure],
  styleUrls: ['./lab.css'],
  styles: `
    .stage { position: relative; }
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
      <label class="tier"><input type="checkbox" [checked]="showTargets()" (change)="showTargets.set($any($event.target).checked)" /> Show targets</label>
      @for (ref of references; track ref.id) {
        <h3>{{ ref.name }}</h3>
        <p class="note">{{ ref.about }}</p>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ ref.composed.scene.id }} · {{ scheme }}</span>
              <div class="stage">
                <figure role="img" [attr.aria-label]="ref.composed.text['alt']" [attr.data-interaction]="ref.id + '-' + scheme"
                        (pointermove)="point(ref, $event)" (pointerleave)="under.set({})">
                  <app-vis-scene [scene]="ref.composed.scene" state="shown" [text]="text(ref.composed)" [scheme]="scheme" />
                </figure>
                @if (showTargets()) {
                  <svg class="targets" [attr.viewBox]="viewBox(ref)" aria-hidden="true">
                    @for (s of ref.shapes; track $index) {
                      <path [class]="s.kind" [attr.d]="s.d" [style.stroke-width]="s.width ? s.width : null" />
                    }
                  </svg>
                }
              </div>
            </div>
          }
        </div>
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
  protected readonly under = signal<Record<string, string>>({});
  protected readonly references: Reference[] = [
    reference('rating', 'A mark on a scale from 1 to 5', 'Drag the mark, or click the line: the mark takes the nearest whole value.', ratingFigure(3)),
    reference('field', 'A mark in a field with two axes', 'Like the cause map: each axis has its own scale; a click in the field places the mark.', fieldFigure(2, 4)),
    reference('choice', 'One of three options', 'Each option is a region, chosen as a whole.', choiceFigure('second')),
  ];

  protected text(composed: Composed): TextLookup {
    return lookupOf(composed);
  }

  protected viewBox(ref: Reference): string {
    const { width, height } = frameSize(ref.composed.scene.frame);
    return `0 0 ${width} ${height}`;
  }

  /** What's under the pointer, in words: the target, and the value a handle would take there. */
  protected point(ref: Reference, event: PointerEvent): void {
    const svg = (event.currentTarget as HTMLElement).querySelector('svg');
    if (!svg) return;
    const p = toScenePoint({ x: event.clientX, y: event.clientY }, svg.getBoundingClientRect(), frameSize(ref.composed.scene.frame));
    this.under.update((u) => ({ ...u, [ref.id]: this.describe(ref, hitTest(ref.targets, p), p) }));
  }

  private describe(ref: Reference, hit: Hit | null, p: readonly [number, number]): string {
    if (!hit) return 'nothing';
    const words = lookupOf(ref.composed)(hit.target.label) ?? '';
    if (hit.kind === 'region') return `region '${hit.id}' (${words}): ${hit.target.value} = ${hit.target.option}`;
    const values = Object.entries(placeAt(ref.composed.scene, hit.target, p))
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');
    return hit.kind === 'handle' ? `handle '${hit.id}' (${words})` : `track '${hit.id}' of '${hit.handle}': a click places it at ${values}`;
  }
}
