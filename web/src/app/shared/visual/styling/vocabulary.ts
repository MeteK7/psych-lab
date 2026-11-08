/**
 * S1 Styling: the vocabulary scenes use (docs/visual-language.md). Data and types only.
 * Scenes name roles, line weights, dashes and materials; they never contain colour values.
 * The values behind the colour roles are in `tokens.css`.
 */

/** Area themes and their versions. A theme change bumps its version, which is recorded with a shown visual. */
export const THEMES = { action: 1, cognitive: 1, attention: 1, regulation: 1, recovery: 1 } as const;
export type ThemeId = keyof typeof THEMES;

/**
 * Colour roles (visual-language.md §3.4). `subject-fill` isn't a scene role: a `subject` drawn
 * with the `tonal` material takes it as its fill.
 */
export const COLOR_ROLES = ['ground', 'far', 'mid', 'near', 'subject', 'context', 'ink'] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

/** Roles that are depth planes or the ground. They carry no emphasis (they're already aerial). */
export const PLANE_ROLES: readonly ColorRole[] = ['ground', 'far', 'mid', 'near'];

/** Line weights in CSS px, the same at every figure size (§4.1). */
export const LINE_WEIGHTS = { hair: 1, fine: 1.5, regular: 2, strong: 2.5, bold: 3 } as const;
export type LineWeight = keyof typeof LINE_WEIGHTS;
export const LINE_ORDER: readonly LineWeight[] = ['hair', 'fine', 'regular', 'strong', 'bold'];

/** Dashes carry meaning only (§4.3). */
export const DASHES = { intended: '7 7', tentative: '0.1 6' } as const;
export type DashPattern = keyof typeof DASHES;

/**
 * Materials built so far (§5): `line` (stroke only), `tonal` (the role's fill with its line) and
 * `solid` (filled in the role's line colour, no stroke: dots and small marks). `lit` and
 * `translucent` are added when a composition pulls them.
 */
export const MATERIALS = ['line', 'tonal', 'solid'] as const;
export type MaterialId = (typeof MATERIALS)[number];

/** Emphasis levels, set by S4 and resolved here (§3.7). */
export type Emphasis = 'focal' | 'normal' | 'receded';

/** Label tones (§9). */
export type LabelTone = 'label' | 'label-soft';
export const LABEL_SIZES: Record<LabelTone, number> = { label: 14, 'label-soft': 13 };

/** Frames at their design width (§12). */
export const FRAMES = {
  banner: { width: 480, height: 120 },
  wide: { width: 640, height: 320 },
  standard: { width: 600, height: 400 },
  square: { width: 400, height: 400 },
} as const;
export type FrameRatio = keyof typeof FRAMES;

/** What an element is, semantically. S1 decides how it looks. */
export interface StyleRef {
  role: ColorRole;
  /** Defaults to the role's weight (§4.2). */
  line?: LineWeight;
  dash?: DashPattern;
  /** Defaults to `line`. */
  material?: MaterialId;
}

/**
 * Pairs that fail contrast in at least one theme (§3.5), so they aren't allowed: lines in the
 * `context` role and soft labels don't sit on the near plane.
 */
export const NOT_ON_NEAR = { roles: ['context'] as readonly ColorRole[], tones: ['label-soft'] as readonly LabelTone[] };

/** Motion tokens (§10), read by S5 once a composition pulls motion. */
export const MOTION = {
  durations: { quick: 150, moderate: 300, deliberate: 600, slow: 900 },
  easing: {
    arrive: 'cubic-bezier(0.2, 0, 0, 1)',
    depart: 'cubic-bezier(0.3, 0, 1, 1)',
    move: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  staggerMs: 60,
  maxStaggered: 3,
} as const;
