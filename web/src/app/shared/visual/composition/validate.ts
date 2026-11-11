import {
  COLOR_ROLES,
  DASHES,
  FRAMES,
  LINE_WEIGHTS,
  MATERIALS,
  MOTION_EFFECTS,
  NOT_ON_NEAR,
  PLANE_ROLES,
  StyleRef,
  THEMES,
} from '../styling/vocabulary';
import { GENERATORS, generatorProblems } from '../generation/registry';
import { boundsOf, boxesOverlap } from './bounds';
import { PURPOSE_KINDS, Purpose, SceneDefinition, SceneElement, TextLookup, elementsOf } from './scene';

/** Any raw colour value: scenes use roles only (docs/visual-system.md §4.3). */
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i;

function styleProblems(where: string, style: StyleRef): string[] {
  const problems: string[] = [];
  if (!(COLOR_ROLES as readonly string[]).includes(style.role)) problems.push(`${where}: unknown role '${style.role}'`);
  if (style.line && !Object.hasOwn(LINE_WEIGHTS, style.line)) problems.push(`${where}: unknown line weight '${style.line}'`);
  if (style.dash && !Object.hasOwn(DASHES, style.dash)) problems.push(`${where}: unknown dash '${style.dash}'`);
  if (style.material && !(MATERIALS as readonly string[]).includes(style.material))
    problems.push(`${where}: unknown material '${style.material}'`);
  if (style.width !== undefined && !(style.width > 0)) problems.push(`${where}: a line width must be positive`);
  return problems;
}

/** Every element earns its place (docs/visual-policy.md §2). */
function purposeProblems(where: string, purpose: Purpose | undefined): string[] {
  if (!purpose || !purpose.serves?.length || !purpose.why?.trim()) return [`${where}: no purpose; every element needs one`];
  return purpose.serves
    .filter((k) => !(PURPOSE_KINDS as readonly string[]).includes(k))
    .map((k) => `${where}: unknown purpose '${k}'`);
}

/** Entrances (read by S5): a known effect, a reason for anything that moves on its own, no chains. */
function entranceProblems(element: SceneElement, all: Map<string, SceneElement>): string[] {
  const { enter } = element;
  if (!enter) return [];
  const where = `element '${element.id}'`;
  const problems: string[] = [];
  if (enter.effect && !Object.hasOwn(MOTION_EFFECTS, enter.effect)) problems.push(`${where}: unknown motion effect '${enter.effect}'`);
  if (enter.effect === 'draw' && element.kind === 'label') problems.push(`${where}: a label can't draw; it fades`);
  // Drawing reveals a band along the outline, so a filled shape's inside would stay hidden.
  if (enter.effect === 'draw' && element.kind !== 'label' && (element.style.material ?? 'line') !== 'line')
    problems.push(`${where}: only line shapes can draw`);
  if (enter.with === undefined) {
    if (!enter.why?.trim()) problems.push(`${where}: motion without a reason; an element that moves on its own says why`);
    return problems;
  }
  const lead = all.get(enter.with);
  if (!lead || enter.with === element.id) problems.push(`${where}: enters with unknown element '${enter.with}'`);
  else if (lead.enter?.with !== undefined) problems.push(`${where}: enters with '${enter.with}', which itself enters with another element`);
  else if (!enter.effect && lead.enter?.effect === 'draw' && element.kind !== 'label' && (element.style.material ?? 'line') !== 'line')
    problems.push(`${where}: would draw with '${enter.with}', but only line shapes can draw; give it its own effect`);
  return problems;
}

/** Whether an element is a closed form that can be filled. */
function closed(element: SceneElement): boolean {
  if (element.kind === 'label') return false;
  if (element.kind === 'generated') return (GENERATORS as Record<string, { closed: boolean | 'band' }>)[element.generator]?.closed !== false;
  const g = element.geometry;
  return g.type !== 'line' && (g.type !== 'path' || /z\s*$/i.test(g.d));
}

/**
 * The materials' rules (milestone M3; visual-language.md §5–§6, visual-policy.md §3.7–§3.8):
 * - `lit` is the subject's, on a closed form
 * - a `shadow` is an ellipse or circle that names the object it sits under, drawn after it
 * - an `overlap` names the two `translucent` forms it belongs to, and is drawn after them
 * - two `translucent` forms that overlap need an `overlap` between them, never an accidental blend
 * - `grounds` and `overlapOf` belong to shadows and overlaps only
 */
function materialProblems(scene: SceneDefinition): string[] {
  const problems: string[] = [];
  const order = elementsOf(scene).map(({ element }) => element);
  const index = new Map(order.map((e, i) => [e.id, i]));
  const material = (e: SceneElement | undefined) => (e && e.kind !== 'label' ? (e.style.material ?? 'line') : null);
  const overlaps = new Set<string>();
  for (const e of order) {
    if (e.kind === 'label') continue;
    const where = `element '${e.id}'`;
    const m = material(e);
    if ((m === 'lit' || m === 'translucent' || m === 'overlap' || m === 'shadow') && !closed(e))
      problems.push(`${where}: '${m}' fills a form; this is an open line`);
    if (m === 'lit' && e.style.role !== 'subject') problems.push(`${where}: 'lit' is for the subject; a plane or context stays flat`);
    if (m === 'shadow') {
      if (e.kind !== 'shape' || (e.geometry.type !== 'ellipse' && e.geometry.type !== 'circle'))
        problems.push(`${where}: a shadow is an ellipse under its object`);
      const target = e.grounds ? order[index.get(e.grounds) ?? -1] : undefined;
      if (!e.grounds) problems.push(`${where}: a shadow names the object it sits under ('grounds')`);
      else if (!target || target.kind === 'label') problems.push(`${where}: grounds unknown element '${e.grounds}'`);
      else if ((index.get(e.grounds) ?? 0) < (index.get(e.id) ?? 0)) problems.push(`${where}: a shadow is drawn before its object`);
    } else if (e.grounds) problems.push(`${where}: only a shadow grounds an object`);
    if (m === 'overlap') {
      if (!e.overlapOf) problems.push(`${where}: an overlap names its two translucent forms ('overlapOf')`);
      else {
        const [a, b] = e.overlapOf;
        overlaps.add([a, b].sort().join('|'));
        for (const id of [a, b]) {
          if (material(order[index.get(id) ?? -1]) !== 'translucent') problems.push(`${where}: '${id}' isn't a translucent form`);
          else if ((index.get(id) ?? 0) > (index.get(e.id) ?? 0)) problems.push(`${where}: an overlap is drawn after its forms`);
        }
      }
    } else if (e.overlapOf) problems.push(`${where}: only an overlap names forms it overlaps`);
    const plane = ['far', 'mid', 'near'].includes(e.style.role);
    if (e.style.edge === 'top') {
      if (!plane || m !== 'tonal') problems.push(`${where}: only a tonal plane (far, mid, near) is drawn by its top edge`);
      const hasEdge =
        e.kind === 'generated'
          ? !!(GENERATORS as Record<string, { edge?: unknown }>)[e.generator]?.edge
          : e.geometry.type === 'rect';
      if (!hasEdge) problems.push(`${where}: this form has no top edge to draw (a rect or a generated plane has)`);
    }
    if (e.style.grain && !(plane || e.style.role === 'ground'))
      problems.push(`${where}: grain is for the ground and planes, never the subject`);
    if (e.style.grain && m !== 'tonal') problems.push(`${where}: grain lies over a fill (tonal)`);
  }
  const translucent = order.filter((e) => material(e) === 'translucent');
  for (let i = 0; i < translucent.length; i++)
    for (let j = i + 1; j < translucent.length; j++) {
      const [a, b] = [boundsOf(scene, translucent[i]), boundsOf(scene, translucent[j])];
      if (a && b && boxesOverlap(a, b) && !overlaps.has([translucent[i].id, translucent[j].id].sort().join('|')))
        problems.push(`'${translucent[i].id}' and '${translucent[j].id}' overlap: draw the overlap as its own shape ('overlap')`);
    }
  return problems;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Every problem with a scene; empty when it's valid. Pure: runs in unit tests and the Visual Lab. */
export function validateScene(scene: SceneDefinition, text: TextLookup): string[] {
  const problems: string[] = [];
  if (!Object.hasOwn(THEMES, scene.theme)) problems.push(`unknown theme '${scene.theme}'`);
  if (typeof scene.frame === 'string') {
    if (!Object.hasOwn(FRAMES, scene.frame)) problems.push(`unknown frame '${scene.frame}'`);
  } else if (!(scene.frame.width > 0 && scene.frame.height > 0)) problems.push('a frame size must be positive');

  const ids = new Map<string, { role?: string; label: boolean }>();
  for (const { layer, element } of elementsOf(scene)) {
    const where = `element '${element.id}'`;
    if (ids.has(element.id)) problems.push(`${where}: duplicate id`);
    problems.push(...purposeProblems(where, element.purpose));
    if (element.kind === 'label') {
      ids.set(element.id, { label: true });
      if (text(element.text) === undefined) problems.push(`${where}: no content for '${element.text}'`);
      if (layer.plane === 'near' && NOT_ON_NEAR.tones.includes(element.tone ?? 'label'))
        problems.push(`${where}: soft labels aren't allowed on the near plane`);
      continue;
    }
    ids.set(element.id, { role: element.style.role, label: false });
    problems.push(...styleProblems(where, element.style));
    if (element.kind === 'generated') {
      problems.push(...generatorProblems(element.generator, element.params).map((p) => `${where}: ${p}`));
      const def = (GENERATORS as Record<string, { seeded: boolean; closed: boolean | 'band' }>)[element.generator];
      if (def?.seeded && !scene.seed) problems.push(`${where}: '${element.generator}' needs the scene's seed`);
      if (def && def.closed === false && (element.style.material ?? 'line') !== 'line')
        problems.push(`${where}: '${element.generator}' makes an open line, which can't be filled`);
    }
    if (layer.plane === 'near' && NOT_ON_NEAR.roles.includes(element.style.role))
      problems.push(`${where}: the '${element.style.role}' role isn't allowed on the near plane`);
  }

  const all = new Map(elementsOf(scene).map(({ element }) => [element.id, element]));
  for (const element of all.values()) problems.push(...entranceProblems(element, all));

  const { initial, states } = scene.states;
  if (!Object.hasOwn(states, initial)) problems.push(`initial state '${initial}' doesn't exist`);
  const maxFocal = scene.policy?.maxFocal ?? 1;
  const shown = new Set<string>();
  for (const [name, state] of Object.entries(states)) {
    const where = `state '${name}'`;
    const alt = scene.alt[name];
    if (!alt) problems.push(`${where}: no text alternative`);
    else if (text(alt) === undefined) problems.push(`${where}: no content for '${alt}'`);
    for (const id of state.visible) {
      if (!ids.has(id)) problems.push(`${where}: unknown element '${id}'`);
      shown.add(id);
    }
    let focal = 0;
    for (const [id, level] of Object.entries(state.emphasis ?? {})) {
      const info = ids.get(id);
      if (!info) problems.push(`${where}: emphasis on unknown element '${id}'`);
      else if (info.label || PLANE_ROLES.includes(info.role as never))
        problems.push(`${where}: '${id}' can't take emphasis (labels and planes don't)`);
      else if (!state.visible.includes(id)) problems.push(`${where}: emphasis on hidden element '${id}'`);
      if (level === 'focal') focal++;
    }
    if (focal > maxFocal) problems.push(`${where}: ${focal} focal elements; the scene allows ${maxFocal}`);
  }
  for (const id of ids.keys()) if (!shown.has(id)) problems.push(`element '${id}': no state shows it`);
  for (const element of all.values())
    if (element.enter && Object.values(states).every((s) => s.visible.includes(element.id)))
      problems.push(`element '${element.id}': has an entrance but is shown in every state`);
  for (const [from, to] of scene.transitions ?? [])
    for (const name of [from, to])
      if (!Object.hasOwn(states, name)) problems.push(`transition ${from} → ${to}: unknown state '${name}'`);
  for (const name of Object.keys(scene.alt))
    if (!Object.hasOwn(states, name)) problems.push(`text alternative for unknown state '${name}'`);

  problems.push(...materialProblems(scene));
  if (strings(scene).some((s) => RAW_COLOUR.test(s))) problems.push('raw colour values found; use roles');
  return problems;
}
