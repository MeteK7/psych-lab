import type { SceneElement } from '../../../../shared/visual/composition/scene';
import type { StyleRef } from '../../../../shared/visual/styling/vocabulary';
import type { V3 } from '../../../../shared/visual/generation/spatial/camera';
import type { StudyCase } from '../cases';
import { FORM_FEATURES, drawable, isEstablished } from '../representation';
import { Cites, path, r2 } from './elements';
import { Pt, circlePath } from './paths';
import { Space } from './spatial';

/**
 * STUDY CODE, revision 5 (representation v0.2): forms from `form` statements, never from words. A
 * thing with no established form statement, or one whose feature the kit doesn't draw, gets the
 * neutral form, and the figure's coverage says its form isn't given.
 */
export interface FormOf {
  /** The feature drawn, or null for the neutral form. */
  feature: (typeof FORM_FEATURES)[number] | null;
  /** The form statements cited (empty for the neutral form). */
  cites: string[];
  /** A feature the text gives that the kit doesn't draw (drawn neutral). */
  unknown?: string;
}

export function formOf(c: StudyCase, id: string): FormOf {
  const s = drawable(c.rep).find((x) => isEstablished(x) && x.say.p === 'form' && x.say.what === id);
  if (!s || s.say.p !== 'form') return { feature: null, cites: [] };
  const known = (FORM_FEATURES as readonly string[]).includes(s.say.feature);
  return known ? { feature: s.say.feature as FormOf['feature'], cites: [s.id] } : { feature: null, cites: [s.id], unknown: s.say.feature };
}

const rounded = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${r2(x + r)} ${r2(y)}H${r2(x + w - r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(x + w)} ${r2(y + r)}V${r2(y + h - r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(x + w - r)} ${r2(y + h)}H${r2(x + r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(x)} ${r2(y + h - r)}V${r2(y + r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(x + r)} ${r2(y)}Z`;

/** A flat form's half extents for a size `r`: so a form can be set on a surface. */
export function extent2d(form: FormOf, r: number): { w: number; h: number } {
  switch (form.feature) {
    case 'round':
      return { w: r, h: r };
    case 'upright':
      return { w: r * 0.55, h: r * 1.25 };
    case 'flat':
      return { w: r * 1.5, h: r * 0.4 };
    case 'long':
      return { w: r * 1.6, h: r * 0.6 };
    default:
      return { w: r, h: r };
  }
}

/** A flat form centred at `at`: round, block and the rest; the neutral form is a soft tile. */
export function form2d(id: string, form: FormOf, at: Pt, r: number, style: StyleRef, cites: Cites, why: string): SceneElement {
  const { w, h } = extent2d(form, r);
  const [x, y] = at;
  const all = [...cites, ...form.cites];
  const said = form.feature ? `${why} Its form (${form.feature}) as the text gives it.` : `${why} Its form isn’t given: the neutral form.`;
  switch (form.feature) {
    case 'round':
      return path(id, circlePath([r2(x), r2(y)], r2(r)), style, all, said);
    case 'block':
      return path(id, rounded(x - w, y - h, 2 * w, 2 * h, 4), style, all, said);
    case 'slope':
      return path(id, `M${r2(x - w)} ${r2(y + h)}L${r2(x + w)} ${r2(y + h)}L${r2(x - w)} ${r2(y - h)}Z`, style, all, said);
    case null:
      return path(id, rounded(x - w, y - h, 2 * w, 2 * h, r * 0.7), style, all, said);
    default:
      return path(id, rounded(x - w, y - h, 2 * w, 2 * h, Math.min(w, h) * 0.5), style, all, said);
  }
}

/** A solid standing on the ground at `at` (its base centre), `size` metres across. */
export function solid(space: Space, id: string, form: FormOf, at: V3, size: number, cites: Cites, why: string): void {
  const all = [...cites, ...form.cites];
  const said = form.feature ? `${why} Its form (${form.feature}) as the text gives it.` : `${why} Its form isn’t given: the neutral form.`;
  const h = size / 2;
  if (form.feature === 'round') {
    space.beads(id, [[at[0], at[1] + h, at[2]]], h, { role: 'subject', material: 'shaded' }, all, said);
    return;
  }
  const [w, d, tall] = form.feature === 'upright' ? [h * 0.55, h * 0.55, size * 1.25] : form.feature === 'flat' ? [h * 1.5, h * 1.2, size * 0.4] : form.feature === 'long' ? [h * 1.6, h * 0.6, size * 0.6] : [h, h, size];
  space.box(id, [at[0] - w, at[1], at[2] - d], [at[0] + w, at[1] + tall, at[2] + d], 'subject', all, said);
}
