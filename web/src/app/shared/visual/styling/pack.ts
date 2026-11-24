/**
 * S1 Styling: the style pack (Stage 3, M0; docs/visual-engine-stage-3-proposal.md §5). The
 * application, not the engine, says which themes exist, their versions and colour ramps, and the
 * words its reviewers read for each purpose kind. The engine knows only the vocabulary of roles,
 * ramps and purposes; another application brings another pack and changes nothing here.
 *
 * Data and pure functions only (rule 2). Putting a pack's ramps on the page is S9's job
 * (`integration/style-pack.ts`).
 */

/** The ramp steps a theme gives, as the role mapping in `tokens.css` reads them (`--vis-a-<step>`). */
export const RAMP_STEPS = ['050', '100', '200', '300', '400', '600', '700', '800', '900', '950'] as const;
export type RampStep = (typeof RAMP_STEPS)[number];
export type Ramp = Readonly<Record<RampStep, string>>;

export interface ThemeDefinition {
  /** Recorded with what was drawn (`theme:<id>@<version>`); a change to the ramp bumps it. */
  version: number;
  ramp: Ramp;
}

export interface StylePack {
  id: string;
  themes: Readonly<Record<string, ThemeDefinition>>;
  /** The words reviewers read for each purpose kind (`composition/scene.ts` PURPOSE_KINDS), by kind id. */
  purposes: Readonly<Record<string, string>>;
}

const THEME_ID = /^[a-z][a-z0-9-]*$/;
const HEX = /^#[0-9a-f]{6}$/i;

/** What is wrong with a pack, if anything. */
export function stylePackProblems(pack: StylePack): string[] {
  const out: string[] = [];
  if (!Object.keys(pack.themes).length) out.push(`${pack.id}: no themes`);
  for (const [id, theme] of Object.entries(pack.themes)) {
    if (!THEME_ID.test(id)) out.push(`${pack.id}: theme id '${id}' must be lower-case letters, digits and hyphens`);
    if (!Number.isInteger(theme.version) || theme.version < 1) out.push(`${pack.id}: theme '${id}' needs a version of 1 or more`);
    for (const step of RAMP_STEPS) if (!HEX.test(theme.ramp[step] ?? '')) out.push(`${pack.id}: theme '${id}' ramp step ${step} must be a #rrggbb colour`);
  }
  return out;
}

let active: StylePack | null = null;

/** Makes a pack the one figures are styled with. Throws on a malformed pack. */
export function registerStylePack(pack: StylePack): void {
  const problems = stylePackProblems(pack);
  if (problems.length) throw new Error(`Style pack rejected: ${problems.join('; ')}`);
  active = pack;
}

/** The registered pack. Throws if the application registered none. */
export function activeStylePack(): StylePack {
  if (!active) throw new Error('No style pack is registered: the application registers one at start-up (registerStylePack)');
  return active;
}

export function knownTheme(id: string): boolean {
  return !!active && Object.hasOwn(active.themes, id);
}

export function themeIds(): string[] {
  return active ? Object.keys(active.themes) : [];
}

export function themeVersion(id: string): number {
  const theme = activeStylePack().themes[id];
  if (!theme) throw new Error(`Theme '${id}' isn't in style pack '${activeStylePack().id}'`);
  return theme.version;
}

export function themeRamp(id: string): Ramp {
  const theme = activeStylePack().themes[id];
  if (!theme) throw new Error(`Theme '${id}' isn't in style pack '${activeStylePack().id}'`);
  return theme.ramp;
}

/** The words for a purpose kind; the kind's own id when the pack gives none. */
export function purposeLabel(kind: string): string {
  return active?.purposes[kind] ?? kind;
}

/**
 * A pack's ramps as CSS, one rule per theme, selected by the theme attribute the figure surfaces
 * already carry (`data-vis-theme`). The role mapping in `tokens.css` reads `--vis-a-<step>`.
 */
export function stylePackCss(pack: StylePack): string {
  return Object.entries(pack.themes)
    .map(([id, { ramp }]) => `[data-vis-theme='${id}'] {\n  ${RAMP_STEPS.map((s) => `--vis-a-${s}: ${ramp[s]};`).join(' ')}\n}`)
    .join('\n');
}
