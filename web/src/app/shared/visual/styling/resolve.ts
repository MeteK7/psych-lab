import {
  ColorRole,
  DASHES,
  Emphasis,
  LABEL_SIZES,
  LINE_ORDER,
  LINE_WEIGHTS,
  LabelTone,
  LineWeight,
  StyleRef,
} from './vocabulary';
import { HALO } from './type';

/**
 * S1 Styling: turns a semantic style reference and an emphasis level into paint. Colours are
 * token references (`var(--vis-…)`); the surface evaluates them for the current scheme (light,
 * dark or forced colours), so a scheme change needs no new frame. Canvas and GPU backends read the
 * same tokens with `getComputedStyle`.
 */
export interface Paint {
  fill: string;
  stroke: string;
  /** Stroke width in CSS px. */
  width: number;
  dash: string | null;
  /** A gradient fill (`lit`, `shadow`); `fill` stays the flat fallback. */
  gradient?:
    | { type: 'linear'; from: readonly [number, number]; to: readonly [number, number]; stops: readonly { offset: number; colour: string }[] }
    | { type: 'radial'; stops: readonly { offset: number; colour: string }[] };
}

/**
 * The lit gradient runs along the platform light (vocabulary LIGHT, azimuth 315°): from the upper
 * left of a form (lit) to its lower right (shaded), with the base tone in the middle.
 */
const LIT_FROM = [0, 0] as const;
const LIT_TO = [1, 1] as const;

export interface TextPaint {
  fill: string;
  size: number;
}

const NONE = 'none';
const token = (name: string) => `var(--vis-${name})`;

/** The weight each role takes unless the scene says otherwise (visual-language.md §4.2). */
const DEFAULT_LINE: Record<ColorRole, LineWeight> = {
  ground: 'hair',
  far: 'hair',
  mid: 'fine',
  near: 'regular',
  subject: 'strong',
  context: 'regular',
  ink: 'strong',
};

/** Each role's fill and line tokens. Planes draw their top edge two steps darker than their fill (§7). */
const FILL: Record<ColorRole, string> = {
  ground: 'ground',
  far: 'far',
  mid: 'mid',
  near: 'near',
  subject: 'subject-fill',
  context: 'context',
  ink: 'ink',
};
const LINE: Record<ColorRole, string | null> = {
  ground: null,
  far: 'far-edge',
  mid: 'mid-edge',
  near: 'near-edge',
  subject: 'subject',
  context: 'context',
  ink: 'ink',
};

function step(weight: LineWeight, by: number): LineWeight {
  const i = LINE_ORDER.indexOf(weight) + by;
  return LINE_ORDER[Math.max(0, Math.min(LINE_ORDER.length - 1, i))];
}

export function resolveStyle(style: StyleRef, emphasis: Emphasis = 'normal'): Paint {
  const { role } = style;
  const material = style.material ?? 'line';
  const base = style.line ?? DEFAULT_LINE[role];
  const weight = emphasis === 'focal' ? step(base, 1) : emphasis === 'receded' ? step(base, -1) : base;

  // Receded: the neutral step with the same index, so lightness and contrast are kept (§3.7).
  // Focal: the role as defined; forced colours turn it into Highlight through --vis-focal.
  let line = LINE[role] ? token(LINE[role]!) : NONE;
  let fill = material === 'tonal' ? token(FILL[role]) : NONE;
  if (emphasis === 'receded') {
    // Context is already neutral: it keeps its colour and recedes by weight only, so it never darkens.
    if (role !== 'context') {
      if (line !== NONE) line = token('receded');
      if (fill !== NONE) fill = role === 'subject' ? token('receded-fill') : token('receded');
    }
  } else if (emphasis === 'focal' && line !== NONE) {
    line = `var(--vis-focal, ${line})`;
  }

  // Solid: a small mark filled in the line colour, with its emphasis (dots, the centre of a marker).
  if (material === 'solid') return { fill: line, stroke: NONE, width: 0, dash: null };
  // Shadow: the shadow tone held across the middle (where the object stands, mostly hidden by it),
  // then a soft fade to nothing at the edge; no line, no emphasis.
  if (material === 'shadow')
    return {
      fill: NONE,
      stroke: NONE,
      width: 0,
      dash: null,
      gradient: {
        type: 'radial',
        stops: [
          { offset: 0, colour: token('shadow') },
          { offset: 0.5, colour: token('shadow') },
          { offset: 1, colour: token('shadow-edge') },
        ],
      },
    };
  if (material === 'translucent') fill = emphasis === 'receded' ? token('receded-fill') : token('translucent');
  if (material === 'overlap') fill = token('overlap');
  if (material === 'lit') {
    // Lit is the subject's: shaded along the light while it has its colour; a receded form is flat.
    fill = emphasis === 'receded' ? token('receded-fill') : token(FILL[role]);
    if (emphasis !== 'receded' && role === 'subject') {
      return {
        fill,
        stroke: line,
        width: line === NONE ? 0 : (style.width ?? LINE_WEIGHTS[weight]),
        dash: style.dash ? DASHES[style.dash] : null,
        gradient: {
          type: 'linear',
          from: LIT_FROM,
          to: LIT_TO,
          stops: [
            { offset: 0, colour: token('subject-lit') },
            { offset: 0.5, colour: token('subject-fill') },
            { offset: 1, colour: token('subject-shade') },
          ],
        },
      };
    }
  }

  return {
    fill,
    stroke: line,
    width: line === NONE ? 0 : (style.width ?? LINE_WEIGHTS[weight]),
    dash: style.dash ? DASHES[style.dash] : null,
  };
}

export function resolveLabel(tone: LabelTone = 'label'): TextPaint {
  return { fill: token(tone), size: LABEL_SIZES[tone] };
}

/** A label's halo (§9): the ground colour, so in forced colours it becomes Canvas with the ground. */
export function resolveHalo(): { colour: string; width: number } {
  return { colour: token('ground'), width: HALO.width };
}
