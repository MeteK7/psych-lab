import { Component, computed, input, signal } from '@angular/core';

import { Composed, composeScene, lookupOf } from '../../shared/visual/composition/compose';
import { Geometry, SceneElement, TextLookup } from '../../shared/visual/composition/scene';
import { flowLayout, gridLayout, packCircles, radialLayout } from '../../shared/visual/generation/layouts';
import { GENERATORS, GeneratorDef, GeneratorId } from '../../shared/visual/generation/registry';
import { SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { StyleRef } from '../../shared/visual/styling/vocabulary';

/** A reference composition shows a capability for review; participants never see it (docs/visual-system.md §5.2). */
const REFERENCE = { serves: ['identity' as const], why: 'Reference composition: shows the generator for review; participants never see it.' };

interface Specimen {
  name: string;
  params: Record<string, number>;
}

/** Two or three parameter sets per generator, on a 480 × 200 frame. */
const SPECIMENS: Record<GeneratorId, Specimen[]> = {
  'form.blob': [
    { name: 'Soft square, gentle wobble', params: { cx: 240, cy: 100, rx: 120, ry: 70, wobble: 0.05, octaves: 1 } },
    { name: 'Ellipse, more wobble and detail', params: { cx: 240, cy: 100, rx: 150, ry: 70, exponent: 2, wobble: 0.12, octaves: 3 } },
    { name: 'No wobble: the plain soft square', params: { cx: 240, cy: 100, rx: 90, ry: 70, wobble: 0 } },
  ],
  'form.ridge': [
    { name: 'A calm ridge', params: { x0: 16, x1: 464, baseline: 110, amplitude: 18, octaves: 2 } },
    { name: 'Larger, with more detail', params: { x0: 16, x1: 464, baseline: 110, amplitude: 40, octaves: 3 } },
  ],
  'form.band': [
    // A ground runs past the frame's edges, so only its top line shows (drawing just a plane's top edge is M3).
    { name: 'A ground', params: { x0: -8, x1: 488, baseline: 120, floor: 208, amplitude: 14, octaves: 2 } },
    { name: 'A low horizon', params: { x0: -8, x1: 488, baseline: 150, floor: 208, amplitude: 8, octaves: 1 } },
  ],
  'curve.rhythm': [
    { name: 'Even waves', params: { x0: 24, x1: 456, y: 100, amplitude: 30, periods: 3 } },
    { name: 'Settling to a line', params: { x0: 24, x1: 456, y: 100, amplitude: 40, periods: 5, decay: 1 } },
  ],
  'field.flow': [
    { name: 'Gentle flow across', params: { x: 8, y: 8, width: 464, height: 184, lines: 30, spacing: 14, scale: 260, turn: 50, heading: 0 } },
    { name: 'Rising, with more detail', params: { x: 8, y: 8, width: 464, height: 184, lines: 40, spacing: 10, scale: 160, turn: 90, heading: -30, octaves: 2 } },
  ],
  'field.contours': [
    { name: 'Broad hills', params: { x: 0, y: 0, width: 480, height: 200, levels: 5, scale: 220, octaves: 1 } },
    { name: 'Finer, more levels', params: { x: 0, y: 0, width: 480, height: 200, levels: 9, scale: 160, octaves: 2, cell: 6 } },
  ],
  'dots.scatter': [
    { name: 'Evenly spread, across', params: { x: 8, y: 8, width: 464, height: 184, spacing: 16, radius: 2 } },
    { name: 'Larger, inside an ellipse', params: { x: 90, y: 10, width: 300, height: 180, spacing: 22, radius: 4, round: 1 } },
  ],
  'dots.grid': [
    { name: 'A grid with a human touch', params: { x: 8, y: 8, width: 464, height: 184, spacing: 24, jitter: 0.2, radius: 2.5 } },
    { name: 'A strict grid', params: { x: 8, y: 8, width: 464, height: 184, spacing: 24, jitter: 0, radius: 2.5 } },
  ],
  'curve.lens': [
    { name: 'Two circles overlapping', params: { x1: 200, y1: 100, r1: 70, x2: 290, y2: 100, r2: 60 } },
    { name: 'A deep overlap', params: { x1: 220, y1: 100, r1: 80, x2: 260, y2: 110, r2: 70 } },
  ],
  'curve.arc': [
    { name: 'A half circle', params: { cx: 240, cy: 150, r: 110, from: 180, to: 360 } },
    { name: 'Three quarters', params: { cx: 240, cy: 100, r: 70, from: -90, to: 180 } },
  ],
};

const LAYOUT_PURPOSE = { serves: ['understanding' as const], why: 'Reference composition: shows the layout for review; participants never see it.' };

function layoutScene(id: string, about: string, elements: SceneElement[]): Composed {
  return composeScene({
    id: `reference.layout.${id}`,
    version: 1,
    theme: 'action',
    size: { width: 480, height: 200 },
    layers: [{ id: 'items', plane: 'subject', elements }],
    alt: `Reference: ${about}`,
  });
}

const item = (id: string, geometry: Geometry): SceneElement => ({
  kind: 'shape',
  id,
  geometry,
  style: { role: 'subject', material: 'tonal' },
  purpose: LAYOUT_PURPOSE,
});

/** The layouts (S2, stage C), each placing a few items as a composition built from data would. */
export const LAYOUTS: { id: string; name: string; about: string; composed: Composed }[] = [
  {
    id: 'grid',
    name: 'gridLayout: 10 items in rows of 5',
    about: 'Cells in reading order, filling the area, evenly apart.',
    composed: layoutScene(
      'grid',
      'a grid',
      gridLayout({ x: 16, y: 16, width: 448, height: 168, count: 10, columns: 5, gap: 12 }).map((c, k) =>
        item(`cell-${k + 1}`, { type: 'rect', x: c.x, y: c.y, width: c.width, height: c.height, rx: 8 }),
      ),
    ),
  },
  {
    id: 'radial',
    name: 'radialLayout: 8 places around a circle',
    about: 'Places evenly around a circle, the first at twelve o’clock, clockwise.',
    composed: layoutScene(
      'radial',
      'places around a circle',
      radialLayout({ count: 8, cx: 240, cy: 100, r: 70 }).map(([x, y], k) => item(`place-${k + 1}`, { type: 'circle', cx: x, cy: y, r: 14 })),
    ),
  },
  {
    id: 'flow',
    name: 'flowLayout: items of different widths, wrapping like words',
    about: 'Items in reading order, wrapping into rows that never run wider than the area.',
    composed: layoutScene(
      'flow',
      'items wrapping into rows',
      flowLayout({ x: 16, y: 24, width: 448, height: 160, widths: [96, 64, 140, 72, 110, 48, 160, 80, 56, 120, 88], rowHeight: 28, gap: 12, align: 'middle' }).map(
        (b, k) => item(`item-${k + 1}`, { type: 'rect', x: b.x, y: b.y, width: b.width, height: b.height, rx: 14 }),
      ),
    ),
  },
  {
    id: 'pack',
    name: 'packCircles: 14 sizes packed around the centre',
    about: 'Circles packed closely around a centre, largest first, never overlapping.',
    composed: layoutScene(
      'pack',
      'circles packed together',
      packCircles({ radii: [40, 32, 28, 24, 22, 20, 18, 16, 14, 12, 12, 10, 8, 8], cx: 240, cy: 100, padding: 4 }).map((c, k) =>
        item(`circle-${k + 1}`, { type: 'circle', cx: c.x, cy: c.y, r: c.r }),
      ),
    ),
  },
];

function specimen(id: GeneratorId, set: Specimen, seed: string): Composed {
  const def: GeneratorDef = GENERATORS[id];
  // Dots solid; closed forms filled; single lines strong; many-line fields fine, so they stay calm.
  const style: StyleRef = id.startsWith('dots.')
    ? { role: 'subject', material: 'solid' }
    : def.closed
    ? { role: 'subject', material: 'tonal' }
    : { role: 'subject', line: id.startsWith('field.') ? 'fine' : 'strong' };
  return composeScene({
    id: `reference.${id}`,
    version: 1,
    theme: 'action',
    size: { width: 480, height: 200 },
    seed,
    layers: [{ id: 'forms', plane: 'subject', elements: [{ kind: 'generated', id: 'form', generator: id, params: set.params, style, purpose: REFERENCE }] }],
    alt: `Reference: ${def.about}`,
  });
}

/** The Visual Lab's catalogue of S2 generators (milestone M2): each with reference compositions and its parameters. */
@Component({
  selector: 'app-lab-generators',
  imports: [SceneFigure],
  template: `
    <section class="scene" aria-labelledby="lab-generators">
      <h2 id="lab-generators">Generators<span class="meta"> · S2 · reference compositions</span></h2>
      <p class="note muted">
        Each generator makes geometry from its parameters and a seed; the same seed always gives the same form. These are
        reference compositions for review: participants never see them. An exercise uses a generator only where the form serves
        a purpose.
      </p>
      <p class="seed">
        Seed <code>{{ seed() }}</code>
        <button type="button" (click)="reseed()">New seed</button>
      </p>
      @for (gen of generators(); track gen.id) {
        <h3>{{ gen.id }}</h3>
        <p class="note">{{ gen.about }}{{ gen.seeded ? '' : ' Not seeded: the same parameters always give the same form.' }}</p>
        @for (set of gen.sets; track set.name; let n = $index) {
          <h4>{{ set.name }}</h4>
          <div class="grid">
            @for (scheme of schemes(); track scheme) {
              <div class="panel" [class]="scheme">
                <span class="tag">{{ gen.id }} · {{ scheme }}</span>
                <figure role="img" [attr.aria-label]="'Reference: ' + gen.about" [attr.data-generator]="gen.id + '-' + n + '-' + scheme">
                  <app-vis-scene [scene]="set.composed.scene" state="shown" [text]="set.text" [scheme]="scheme" />
                </figure>
              </div>
            }
          </div>
        }
        <table>
          <caption>Parameters of {{ gen.id }}</caption>
          <thead><tr><th scope="col">Parameter</th><th scope="col">Range</th><th scope="col">What it does</th></tr></thead>
          <tbody>
            @for (p of gen.params; track p.name) {
              <tr><th scope="row"><code>{{ p.name }}</code></th><td>{{ p.range }}</td><td>{{ p.about }}</td></tr>
            }
          </tbody>
        </table>
      }

      <h3 id="lab-layouts">Layouts</h3>
      <p class="note muted">
        Where a composition built from data places its items: positions and sizes, never drawing, no seed. Instruments call them directly.
      </p>
      @for (layout of layouts; track layout.id) {
        <h4>{{ layout.name }}</h4>
        <p class="note">{{ layout.about }}</p>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ layout.id }} · {{ scheme }}</span>
              <figure role="img" [attr.aria-label]="'Reference: ' + layout.about" [attr.data-layout]="layout.id + '-' + scheme">
                <app-vis-scene [scene]="layout.composed.scene" state="shown" [text]="layoutText(layout.composed)" [scheme]="scheme" />
              </figure>
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrls: ['./lab.css'],
  styles: `
    .seed { display: flex; gap: 0.75rem; align-items: center; font-size: 0.9rem; }
    h4 { margin: 0.75rem 0 0.4rem; }
  `,
})
export class LabGenerators {
  readonly schemes = input.required<SurfaceScheme[]>();
  protected readonly seed = signal('lab-1');
  private seeds = 1;

  protected readonly generators = computed(() =>
    (Object.keys(GENERATORS) as GeneratorId[]).map((id) => {
      const def: GeneratorDef = GENERATORS[id];
      return {
        id,
        about: def.about,
        seeded: def.seeded,
        sets: SPECIMENS[id].map((set) => {
          const composed = specimen(id, set, this.seed());
          return { name: set.name, composed, text: lookupOf(composed) as TextLookup };
        }),
        params: Object.entries(def.params).map(([name, spec]) => ({
          name,
          range: `${spec.min} to ${spec.max}${spec.integer ? ', whole' : ''}${spec.default !== undefined ? `; default ${spec.default}` : '; required'}`,
          about: spec.about,
        })),
      };
    }),
  );

  protected readonly layouts = LAYOUTS;
  protected layoutText(composed: Composed): TextLookup {
    return lookupOf(composed);
  }

  protected reseed(): void {
    this.seed.set(`lab-${++this.seeds}`);
  }
}

/** Every reference composition with the current seed, for tests. */
export function referenceCompositions(seed = 'lab-1'): Composed[] {
  return (Object.keys(SPECIMENS) as GeneratorId[]).flatMap((id) => SPECIMENS[id].map((set) => specimen(id, set, seed)));
}
