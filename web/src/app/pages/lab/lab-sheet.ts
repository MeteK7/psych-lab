import { Component, input } from '@angular/core';

import { Composed, lookupOf } from '../../shared/visual/composition/compose';
import { TextLookup } from '../../shared/visual/composition/scene';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { GRAIN, LIGHT } from '../../shared/visual/styling/vocabulary';
import { AREAS, depthFigure, linesFigure, materialsFigure, typeFigure } from './lab-sheet-figures';
import { LabSwatches, NEUTRAL_STEPS, Swatch } from './lab-swatches';

/** The roles in the order visual-language.md §3.4 and §5 give them, with what each is for. */
const ROLES: readonly { token: string; about: string; opacity?: number }[] = [
  { token: 'ground', about: 'ground (the page)' },
  { token: 'far', about: 'far plane' },
  { token: 'far-edge', about: 'its edge' },
  { token: 'mid', about: 'middle plane' },
  { token: 'mid-edge', about: 'its edge' },
  { token: 'near', about: 'near plane' },
  { token: 'near-edge', about: 'its edge' },
  { token: 'subject', about: 'subject line' },
  { token: 'subject-fill', about: 'subject fill' },
  { token: 'subject-lit', about: 'lit side' },
  { token: 'subject-shade', about: 'shaded side' },
  { token: 'context', about: 'context' },
  { token: 'ink', about: 'ink' },
  { token: 'label', about: 'label' },
  { token: 'label-soft', about: 'soft label' },
  { token: 'receded', about: 'receded line' },
  { token: 'receded-fill', about: 'receded fill' },
  { token: 'translucent', about: 'translucent' },
  { token: 'overlap', about: 'overlap' },
  { token: 'shadow', about: 'contact shadow' },
  { token: 'grain', about: `grain (at ${GRAIN.opacity * 100}%)`, opacity: GRAIN.opacity },
];

/**
 * The visual-language review sheet (milestone M3 stage C), in the Visual Lab: every value of
 * visual-language.md drawn from the real tokens, light and dark, for its review (R1). Colours are
 * chips on a figure surface; lines, materials, light, planes and type are reference compositions
 * drawn by the pipeline.
 */
@Component({
  selector: 'app-lab-sheet',
  imports: [SceneFigure, LabSwatches],
  styleUrls: ['./lab.css'],
  styles: `
    .ramp { display: grid; grid-template-columns: 9rem 1fr; gap: 0.25rem 0.5rem; align-items: start; font-size: 0.8rem; }
    .roles { display: grid; grid-template-columns: 8.5rem repeat(5, 1fr); gap: 0 4px; font-size: 0.8rem; }
    .roles .names { display: flex; flex-direction: column; gap: 4px; }
    .roles .names span { height: 40px; line-height: 1.2; }
    .roles .head { font-size: 0.75rem; height: 1.4rem; }
    .stack { display: flex; flex-direction: column; gap: 0.5rem; }
    .warnings { font-size: 0.85rem; margin: 0.4rem 0 0; }
    h4 { margin: 0.9rem 0 0.4rem; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-sheet">
      <h2 id="lab-sheet">Visual language review sheet<span class="meta"> · S1 · visual-language.md, review R1</span></h2>
      <p class="note muted">
        Every value of the visual language, drawn from the tokens the figures use (styling/tokens.css and vocabulary.ts), in
        light and dark. A change to a token shows here at once. Under each colour, the value it takes.
      </p>

      <h3>Colour ranges: the neutral and the five areas</h3>
      <p class="note">One lightness ladder for every range, so step 600 weighs the same in every area (§3.1). The area ranges have no 500: no role uses it.</p>
      <div class="stack">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme" [attr.data-sheet]="'ramps-' + scheme">
            <span class="tag">ramps · {{ scheme }}</span>
            <div class="ramp">
              <span>Neutral</span>
              <app-lab-swatches [scheme]="scheme" [swatches]="neutral" [steps]="true" />
              @for (area of areas; track area.theme) {
                <span>{{ area.name }}</span>
                <app-lab-swatches [theme]="area.theme" [scheme]="scheme" [swatches]="ramp" [steps]="true" />
              }
            </div>
          </div>
        }
      </div>

      <h3>Roles in each area</h3>
      <p class="note">
        What scenes name: each role takes a step of its area's range, per scheme (§3.4); in high contrast, a system colour (§3.6).
        Columns: {{ areaList }}.
      </p>
      <div class="grid">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme" [attr.data-sheet]="'roles-' + scheme">
            <span class="tag">roles · {{ scheme }}</span>
            <div class="roles">
              <div class="names">
                <span class="head"></span>
                @for (r of roles; track r.token) { <span><code>{{ r.token }}</code><br /><span class="muted">{{ r.about }}</span></span> }
              </div>
              @for (area of areas; track area.theme) {
                <div>
                  <div class="head">{{ area.theme }}</div>
                  <app-lab-swatches [theme]="area.theme" [scheme]="scheme" [swatches]="roles" [column]="true" />
                </div>
              }
            </div>
          </div>
        }
      </div>

      <h3>Line weights and dashes</h3>
      <p class="note">The same width at every figure size (§4.1). Dashes carry meaning only: intended, and tentative (§4.3).</p>
      <div class="grid">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme">
            <span class="tag">lines · {{ scheme }}</span>
            <figure role="img" [attr.aria-label]="alt(lines)" [attr.data-sheet]="'lines-' + scheme">
              <app-vis-scene [scene]="lines.scene" state="shown" [text]="text(lines)" [scheme]="scheme" />
            </figure>
          </div>
        }
      </div>

      <h3>Materials, light and planes in each area</h3>
      <p class="note">
        All matte, under the one platform light from the upper left (azimuth {{ light.azimuth }}°, elevation {{ light.elevation }}°,
        §5–§7). Under the materials, depth: far, middle and near planes drawn by their top edge, and a lit subject with its contact
        shadow.
      </p>
      @for (area of specimens; track area.theme) {
        <h4>{{ area.name }}</h4>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ area.theme }} · {{ scheme }}</span>
              <div class="stack">
                <figure role="img" [attr.aria-label]="alt(area.materials)" [attr.data-sheet]="'materials-' + area.theme + '-' + scheme">
                  <app-vis-scene [scene]="area.materials.scene" state="shown" [text]="text(area.materials)" [scheme]="scheme" />
                </figure>
                <figure role="img" [attr.aria-label]="alt(area.depth)" [attr.data-sheet]="'depth-' + area.theme + '-' + scheme">
                  <app-vis-scene [scene]="area.depth.scene" state="shown" [text]="text(area.depth)" [scheme]="scheme" />
                </figure>
              </div>
            </div>
          }
        </div>
      }

      <h3>Type in figures</h3>
      <p class="note">
        The page's system face; labels at 14 px, soft labels at 13 px, bold only for the one current value; lines 1.2 apart. A
        label keeps 8 units from any form it doesn't name; over a plane's edge, it takes a halo in the ground colour (§9).
      </p>
      <div class="grid">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme">
            <span class="tag">type · {{ scheme }}</span>
            <figure role="img" [attr.aria-label]="alt(type)" [attr.data-sheet]="'type-' + scheme">
              <app-vis-scene [scene]="type.scene" state="shown" [text]="text(type)" [scheme]="scheme" />
            </figure>
          </div>
        }
      </div>
      <p class="warnings">
        <span class="muted">The spacing check on this figure (warnings, not errors; the one without a halo is its example):</span>
      </p>
      <ul class="warnings" aria-label="Spacing warnings: type">
        @for (w of typeWarnings; track w) { <li>{{ w }}</li> }
      </ul>
    </section>
  `,
})
export class LabSheet {
  readonly schemes = input.required<SurfaceScheme[]>();
  protected readonly areas = AREAS;
  protected readonly areaList = AREAS.map((a) => `${a.theme} (${a.name})`).join(', ');
  protected readonly neutral: Swatch[] = NEUTRAL_STEPS.map((s) => ({ token: `n-${s}` }));
  /** Every neutral step, so the columns line up; the area ranges' unused 500 shows as an empty slot. */
  protected readonly ramp: Swatch[] = NEUTRAL_STEPS.map((s) => ({ token: `a-${s}` }));
  protected readonly roles = ROLES;
  protected readonly light = LIGHT;
  protected readonly lines = linesFigure();
  protected readonly type = typeFigure();
  protected readonly typeWarnings = spacingWarnings(this.type.scene, lookupOf(this.type));
  protected readonly specimens = AREAS.map((a) => ({ ...a, materials: materialsFigure(a.theme), depth: depthFigure(a.theme) }));

  protected text(composed: Composed): TextLookup {
    return lookupOf(composed);
  }
  protected alt(composed: Composed): string {
    return composed.text['alt'];
  }
}
