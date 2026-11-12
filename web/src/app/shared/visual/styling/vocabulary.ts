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
 * Materials (§5), all matte:
 * - `line`: stroke only. `tonal`: the role's fill with its line. `solid`: filled in the role's line
 *   colour, no stroke (dots and small marks).
 * - `lit` (M3): the subject's fill shaded along the platform light (§6), lit side one step lighter,
 *   shaded side one step darker; with its line.
 * - `translucent` (M3): the area colour, partly see-through, with its line. Where two overlap, the
 *   overlap is its own shape in the `overlap` material, with a defined tone, never left to blending.
 * - `shadow` (M3): a contact shadow, a soft radial fade on an ellipse under an object; no line.
 */
export const MATERIALS = ['line', 'tonal', 'solid', 'lit', 'translucent', 'overlap', 'shadow'] as const;

/** The one platform light (§6): from the upper left, the same in every scene, area and scheme. */
export const LIGHT = { azimuth: 315, elevation: 45 } as const;
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
/** An explicit design size, for compositions built from data (an instrument, a game). */
export interface FrameSize {
  width: number;
  height: number;
}

/** A frame's design size, named or explicit. */
export function frameSize(frame: FrameRatio | FrameSize): FrameSize {
  return typeof frame === 'string' ? FRAMES[frame] : frame;
}

/** What an element is, semantically. S1 decides how it looks. */
export interface StyleRef {
  role: ColorRole;
  /** Defaults to the role's weight (§4.2). */
  line?: LineWeight;
  dash?: DashPattern;
  /** Defaults to `line`. */
  material?: MaterialId;
  /**
   * An exact line width in scene units, instead of a weight. Only for interaction targets that
   * must read while they move (the dot game's ring); figures use `line`. Emphasis doesn't change it.
   */
  width?: number;
  /**
   * `top`: a plane is filled without an outline and only its top silhouette is drawn, two steps darker
   * than its fill (§7). For planes (`far`, `mid`, `near`) in the `tonal` material.
   */
  edge?: 'top';
  /** A faint grain over the fill (§5): the ground and planes only, never the subject or text. Off unless asked for. */
  grain?: boolean;
}

/** The smallest pointer target in scene units (1 unit = 1 CSS px at design width), WCAG 2.5.8 (M4). */
export const MIN_TARGET = 24;

/**
 * The keyboard focus ring on a figure that is itself the control (M4): a line in the `focus` token
 * (the page's accent; the system highlight in forced colours), `gap` units outside the target.
 */
export const FOCUS_RING = { gap: 3, width: 2 } as const;

/** The grain texture (§5): a tile of fine seeded dots, at most 6% opacity. */
export const GRAIN = { opacity: 0.05, tile: 64, spacing: 6, radius: 0.6, seed: 'platform-grain' } as const;

/**
 * Pairs that fail contrast in at least one theme (§3.5), so they aren't allowed: lines in the
 * `context` role and soft labels don't sit on the near plane.
 */
export const NOT_ON_NEAR = { roles: ['context'] as readonly ColorRole[], tones: ['label-soft'] as readonly LabelTone[] };

/** Motion tokens (§10), read by S5. */
export const MOTION = {
  durations: { quick: 150, moderate: 300, deliberate: 600, slow: 900 },
  easing: {
    arrive: 'cubic-bezier(0.2, 0, 0, 1)',
    depart: 'cubic-bezier(0.3, 0, 1, 1)',
    move: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  staggerMs: 60,
  /** At most this many elements move in one state change (visual-policy.md §3.12). */
  maxStaggered: 3,
} as const;
export type MotionDuration = keyof typeof MOTION.durations;
export type MotionEasing = keyof typeof MOTION.easing;

/**
 * Effects built so far (§10), each with its preset. An element that appears in a state change
 * enters with one of them; the effect is named in the scene, the values live here.
 * `fade`: opacity 0 → 1. `rise`: fades in while moving up `distance` units into its place.
 * `draw`: revealed along its own direction (shapes only; dashed lines are revealed through a mask).
 */
export const MOTION_EFFECTS = {
  fade: { duration: 'moderate', easing: 'arrive' },
  rise: { duration: 'deliberate', easing: 'arrive', distance: 8 },
  draw: { duration: 'deliberate', easing: 'move' },
} as const satisfies Record<string, { duration: MotionDuration; easing: MotionEasing; distance?: number }>;
export type MotionEffect = keyof typeof MOTION_EFFECTS;

/** An element that stays but changes emphasis eases between the two paints (§3.7). */
export const EMPHASIS_CHANGE = { duration: 'moderate', easing: 'move' } as const satisfies {
  duration: MotionDuration;
  easing: MotionEasing;
};
