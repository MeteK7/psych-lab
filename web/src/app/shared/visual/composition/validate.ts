import {
  COLOR_ROLES,
  DASHES,
  FRAMES,
  LINE_WEIGHTS,
  MATERIALS,
  NOT_ON_NEAR,
  PLANE_ROLES,
  StyleRef,
  THEMES,
} from '../styling/vocabulary';
import { PURPOSE_KINDS, Purpose, SceneDefinition, TextLookup, elementsOf } from './scene';

/** Any raw colour value: scenes use roles only (docs/visual-system.md §4.3). */
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i;

function styleProblems(where: string, style: StyleRef): string[] {
  const problems: string[] = [];
  if (!(COLOR_ROLES as readonly string[]).includes(style.role)) problems.push(`${where}: unknown role '${style.role}'`);
  if (style.line && !Object.hasOwn(LINE_WEIGHTS, style.line)) problems.push(`${where}: unknown line weight '${style.line}'`);
  if (style.dash && !Object.hasOwn(DASHES, style.dash)) problems.push(`${where}: unknown dash '${style.dash}'`);
  if (style.material && !(MATERIALS as readonly string[]).includes(style.material))
    problems.push(`${where}: unknown material '${style.material}'`);
  return problems;
}

/** Every element earns its place (docs/visual-policy.md §2). */
function purposeProblems(where: string, purpose: Purpose | undefined): string[] {
  if (!purpose || !purpose.serves?.length || !purpose.why?.trim()) return [`${where}: no purpose; every element needs one`];
  return purpose.serves
    .filter((k) => !(PURPOSE_KINDS as readonly string[]).includes(k))
    .map((k) => `${where}: unknown purpose '${k}'`);
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
  if (!Object.hasOwn(FRAMES, scene.frame)) problems.push(`unknown frame '${scene.frame}'`);

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
    if (layer.plane === 'near' && NOT_ON_NEAR.roles.includes(element.style.role))
      problems.push(`${where}: the '${element.style.role}' role isn't allowed on the near plane`);
  }

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
  for (const name of Object.keys(scene.alt))
    if (!Object.hasOwn(states, name)) problems.push(`text alternative for unknown state '${name}'`);

  if (strings(scene).some((s) => RAW_COLOUR.test(s))) problems.push('raw colour values found; use roles');
  return problems;
}
