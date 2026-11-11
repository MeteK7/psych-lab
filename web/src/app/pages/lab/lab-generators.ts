import { Component, computed, input, signal } from '@angular/core';

import { Composed, composeScene, lookupOf } from '../../shared/visual/composition/compose';
import { TextLookup } from '../../shared/visual/composition/scene';
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
  'curve.arc': [
    { name: 'A half circle', params: { cx: 240, cy: 150, r: 110, from: 180, to: 360 } },
    { name: 'Three quarters', params: { cx: 240, cy: 100, r: 70, from: -90, to: 180 } },
  ],
};

function specimen(id: GeneratorId, set: Specimen, seed: string): Composed {
  const def: GeneratorDef = GENERATORS[id];
  // Closed forms filled; single lines strong; many-line fields fine, so they stay calm.
  const style: StyleRef = def.closed
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

  protected reseed(): void {
    this.seed.set(`lab-${++this.seeds}`);
  }
}

/** Every reference composition with the current seed, for tests. */
export function referenceCompositions(seed = 'lab-1'): Composed[] {
  return (Object.keys(SPECIMENS) as GeneratorId[]).flatMap((id) => SPECIMENS[id].map((set) => specimen(id, set, seed)));
}
