import { Component, input } from '@angular/core';

import { Composed, composeScene, lookupOf } from '../../shared/visual/composition/compose';
import { SceneElement, TextLookup } from '../../shared/visual/composition/scene';
import { SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { MaterialId, ThemeId } from '../../shared/visual/styling/vocabulary';

/** A reference composition shows a capability for review; participants never see it (docs/visual-system.md §5.2). */
const REFERENCE = { serves: ['identity' as const], why: 'Reference composition: shows a material for review; participants never see it.' };

function reference(id: string, about: string, elements: SceneElement[]): Composed {
  return composeScene({
    id: `reference.material.${id}`,
    version: 1,
    theme: 'action',
    size: { width: 480, height: 200 },
    layers: [{ id: 'forms', plane: 'subject', elements }],
    alt: `Reference: ${about}`,
  });
}

/**
 * Depth (§7): far, middle and near planes, each drawn by its top edge, and a lit subject standing on
 * the near plane with its contact shadow. With `grain`, the planes carry the faint grain (§5).
 */
export function depth(id: string, about: string, grain: boolean, theme: ThemeId = 'action'): Composed {
  const plane = (role: 'far' | 'mid' | 'near', baseline: number, amplitude: number): SceneElement => ({
    kind: 'generated',
    id: role,
    generator: 'form.band',
    params: { x0: -8, x1: 488, baseline, floor: 208, amplitude, octaves: 2 },
    style: { role, material: 'tonal', edge: 'top', ...(grain ? { grain: true } : {}) },
    purpose: REFERENCE,
  });
  return composeScene({
    id: `reference.material.${id}`,
    version: 1,
    theme,
    size: { width: 480, height: 200 },
    seed: 'lab-depth',
    layers: [
      { id: 'far', plane: 'far', elements: [plane('far', 92, 16)] },
      { id: 'mid', plane: 'mid', elements: [plane('mid', 124, 12)] },
      { id: 'near', plane: 'near', elements: [plane('near', 160, 6)] },
      {
        id: 'subject',
        plane: 'subject',
        elements: [
          {
            kind: 'shape',
            id: 'shadow',
            geometry: { type: 'ellipse', cx: 300, cy: 162, rx: 30, ry: 4 },
            style: { role: 'ink', material: 'shadow' },
            purpose: REFERENCE,
            grounds: 'form',
          },
          { kind: 'shape', id: 'form', geometry: { type: 'circle', cx: 300, cy: 129, r: 32 }, style: { role: 'subject', material: 'lit' }, purpose: REFERENCE },
        ],
      },
    ],
    alt: `Reference: ${about}`,
  });
}

const circle = (id: string, cx: number, material: MaterialId): SceneElement => ({
  kind: 'shape',
  id,
  geometry: { type: 'circle', cx, cy: 92, r: 44 },
  style: { role: 'subject', material },
  purpose: REFERENCE,
});

/** Materials and light (S1, milestone M3 stage A), each as a small reference composition. */
export const MATERIALS_REFERENCES: { id: string; name: string; about: string; composed: Composed }[] = [
  {
    id: 'set',
    name: 'line · tonal · solid · lit',
    about: 'The same form in four materials: a stroke, a flat fill, a solid mark, and lit along the platform light.',
    composed: reference('set', 'four materials', [
      circle('line', 72, 'line'),
      circle('tonal', 184, 'tonal'),
      { kind: 'shape', id: 'solid', geometry: { type: 'circle', cx: 296, cy: 92, r: 14 }, style: { role: 'subject', material: 'solid' }, purpose: REFERENCE },
      circle('lit', 408, 'lit'),
    ]),
  },
  {
    id: 'grounded',
    name: 'A lit form resting on the ground, with its contact shadow',
    about: 'The light comes from the upper left; the shadow is a soft ellipse under the form, never a cast or drop shadow.',
    composed: reference('grounded', 'a lit form with its contact shadow', [
      { kind: 'shape', id: 'ground', geometry: { type: 'line', x1: 80, y1: 160, x2: 400, y2: 160 }, style: { role: 'context', line: 'hair' }, purpose: REFERENCE },
      {
        kind: 'shape',
        id: 'shadow',
        geometry: { type: 'ellipse', cx: 240, cy: 160, rx: 54, ry: 7 },
        style: { role: 'ink', material: 'shadow' },
        purpose: REFERENCE,
        grounds: 'form',
      },
      { kind: 'shape', id: 'form', geometry: { type: 'circle', cx: 240, cy: 102, r: 58 }, style: { role: 'subject', material: 'lit' }, purpose: REFERENCE },
    ]),
  },
  {
    id: 'depth',
    name: 'Depth: far, middle and near planes by their top edge, with a subject on the near plane',
    about: 'Farther planes are lighter and calmer; each plane is filled without an outline and only its top line is drawn.',
    composed: depth('depth', 'planes in depth with a subject', false),
  },
  {
    id: 'grain',
    name: 'The same, with grain on the planes (5%)',
    about: 'A faint grain on the ground and planes only, never the subject; off unless a figure asks for it.',
    composed: depth('grain', 'planes in depth with grain', true),
  },
  {
    id: 'overlap',
    name: 'Two translucent forms and their overlap',
    about: 'Where two see-through forms share space, the overlap is its own shape with a defined tone, never an accidental blend.',
    composed: reference('overlap', 'two translucent forms and their overlap', [
      { kind: 'shape', id: 'left', geometry: { type: 'circle', cx: 200, cy: 100, r: 72 }, style: { role: 'subject', material: 'translucent' }, purpose: REFERENCE },
      { kind: 'shape', id: 'right', geometry: { type: 'circle', cx: 290, cy: 100, r: 72 }, style: { role: 'subject', material: 'translucent' }, purpose: REFERENCE },
      {
        kind: 'generated',
        id: 'both',
        generator: 'curve.lens',
        params: { x1: 200, y1: 100, r1: 72, x2: 290, y2: 100, r2: 72 },
        style: { role: 'subject', material: 'overlap' },
        purpose: REFERENCE,
        overlapOf: ['left', 'right'],
      },
    ]),
  },
];

/** The Visual Lab's materials and light (milestone M3). */
@Component({
  selector: 'app-lab-materials',
  imports: [SceneFigure],
  styleUrls: ['./lab.css'],
  template: `
    <section class="scene" aria-labelledby="lab-materials">
      <h2 id="lab-materials">Materials and light<span class="meta"> · S1 · reference compositions</span></h2>
      <p class="note muted">
        All matte, under one light from the upper left (visual-language.md §5–§6). In high contrast every material flattens to
        system colours: no shading, no see-through, the overlap stays distinct, and the shadow disappears.
      </p>
      @for (ref of references; track ref.id) {
        <h3>{{ ref.name }}</h3>
        <p class="note">{{ ref.about }}</p>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ ref.id }} · {{ scheme }}</span>
              <figure role="img" [attr.aria-label]="'Reference: ' + ref.about" [attr.data-material]="ref.id + '-' + scheme">
                <app-vis-scene [scene]="ref.composed.scene" state="shown" [text]="text(ref.composed)" [scheme]="scheme" />
              </figure>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class LabMaterials {
  readonly schemes = input.required<SurfaceScheme[]>();
  protected readonly references = MATERIALS_REFERENCES;
  protected text(composed: Composed): TextLookup {
    return lookupOf(composed);
  }
}
