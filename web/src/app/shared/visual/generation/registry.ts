import { arc, lens } from './curves';
import { dotsPath, jitteredGrid, poissonDisc } from './distributions';
import { contours, flowLines } from './fields';
import { blob, ridge, rhythm } from './forms';

/**
 * S2 Generation: every generator a scene can name, with its parameters (docs/visual-system.md §3.3).
 * A scene's `generated` element names one here; the validator checks its parameters, and the
 * pipeline runs it with the element's own seed. Generators are pure: the same parameters and seed
 * always give the same path.
 */
export interface ParamSpec {
  min: number;
  max: number;
  /** Used when a scene leaves the parameter out. Without one, the parameter is required. */
  default?: number;
  integer?: boolean;
  /** For reviewers: what the parameter does. */
  about: string;
}

export interface GeneratorDef {
  /** What it makes, for reviewers and the Visual Lab. */
  about: string;
  /** A closed form can be filled; an open line can't, and only lines can draw on. */
  closed: boolean | 'band';
  /** Whether the seed changes the result. */
  seeded: boolean;
  params: Readonly<Record<string, ParamSpec>>;
  run(params: Readonly<Record<string, number>>, seed: string): string;
  /** A plane's top silhouette, for drawing only its top edge (M3): the same line its fill is closed from. */
  edge?(params: Readonly<Record<string, number>>, seed: string): string;
}

const X = { min: -2000, max: 4000, about: 'A position in scene units' };
const SIZE = { min: 1, max: 2000, about: 'A size in scene units' };

export const GENERATORS = {
  'form.blob': {
    about: 'An organic closed form: a soft square whose outline wobbles calmly with seeded noise',
    closed: true,
    seeded: true,
    params: {
      cx: X,
      cy: X,
      rx: SIZE,
      ry: SIZE,
      exponent: { min: 2, max: 8, default: 4, about: '2 is an ellipse, 4 the soft square, 8 almost a rectangle' },
      wobble: { min: 0, max: 0.12, default: 0.06, about: 'How much the outline wobbles, as a share of the size; at most 12%' },
      octaves: { min: 1, max: 3, default: 2, integer: true, about: 'Layers of detail in the wobble; at most 3' },
    },
    run: (p, seed) => blob(p as Parameters<typeof blob>[0], seed),
  },
  'form.ridge': {
    about: 'A calm line across, whose height wobbles with seeded noise around a baseline',
    closed: false,
    seeded: true,
    params: {
      x0: X,
      x1: X,
      baseline: X,
      amplitude: { min: 0, max: 500, default: 12, about: 'The largest rise or dip, in scene units; at most 12% of the length' },
      octaves: { min: 1, max: 3, default: 2, integer: true, about: 'Layers of detail; at most 3' },
    },
    run: (p, seed) => ridge({ ...(p as Omit<Parameters<typeof ridge>[0], 'band'>), band: false }, seed),
  },
  'form.band': {
    about: 'A ridge closed down to a floor, so it can be filled: a ground, a horizon',
    closed: 'band',
    seeded: true,
    params: {
      x0: X,
      x1: X,
      baseline: X,
      floor: X,
      amplitude: { min: 0, max: 500, default: 12, about: 'The largest rise or dip, in scene units; at most 12% of the length' },
      octaves: { min: 1, max: 3, default: 2, integer: true, about: 'Layers of detail; at most 3' },
    },
    run: (p, seed) => ridge({ ...(p as Omit<Parameters<typeof ridge>[0], 'band'>), band: true }, seed),
    edge: (p, seed) => ridge({ ...(p as Omit<Parameters<typeof ridge>[0], 'band'>), band: false }, seed),
  },
  'curve.rhythm': {
    about: 'A regular, calm wave that can settle to a line: a rhythm, a breath',
    closed: false,
    seeded: false,
    params: {
      x0: X,
      x1: X,
      y: X,
      amplitude: { min: 0, max: 200, about: 'Height of the wave, in scene units' },
      periods: { min: 0.5, max: 12, default: 3, about: 'How many waves along the length' },
      decay: { min: 0, max: 1, default: 0, about: '0 keeps the waves even; 1 settles them to a line at the end' },
    },
    run: (p) => rhythm(p as Parameters<typeof rhythm>[0]),
  },
  'curve.arc': {
    about: 'An arc of a circle; angles in degrees from three o’clock, clockwise',
    closed: false,
    seeded: false,
    params: {
      cx: X,
      cy: X,
      r: SIZE,
      from: { min: -720, max: 720, about: 'Start angle in degrees' },
      to: { min: -720, max: 720, about: 'End angle in degrees' },
    },
    run: ({ cx, cy, r, from, to }) => arc(cx, cy, r, from, to),
  },
  'field.flow': {
    about: 'Flow lines: calm streamlines through a seeded direction field, evenly spaced, never crossing',
    closed: false,
    seeded: true,
    params: {
      x: X,
      y: X,
      width: SIZE,
      height: SIZE,
      lines: { min: 1, max: 200, default: 24, integer: true, about: 'How many lines, at most' },
      spacing: { min: 4, max: 200, default: 14, about: 'The closest two lines come, in scene units' },
      scale: { min: 20, max: 2000, default: 220, about: 'The size of the field’s features, in scene units; larger is calmer' },
      turn: { min: 0, max: 180, default: 60, about: 'How far a line can swing from the main heading, in degrees' },
      heading: { min: -360, max: 360, default: 0, about: 'The main direction, in degrees from three o’clock, clockwise' },
      octaves: { min: 1, max: 3, default: 1, integer: true, about: 'Layers of detail in the field; at most 3' },
      length: { min: 10, max: 4000, default: 400, about: 'The longest a line gets, in scene units' },
    },
    run: (p, seed) => flowLines(p as unknown as Parameters<typeof flowLines>[0], seed),
  },
  'field.contours': {
    about: 'Contour lines: where a calm seeded height field crosses evenly spaced levels, like a map',
    closed: false,
    seeded: true,
    params: {
      x: X,
      y: X,
      width: SIZE,
      height: SIZE,
      levels: { min: 1, max: 12, default: 5, integer: true, about: 'How many heights get a line' },
      scale: { min: 20, max: 2000, default: 200, about: 'The size of the hills and hollows, in scene units' },
      octaves: { min: 1, max: 3, default: 2, integer: true, about: 'Layers of detail; at most 3' },
      cell: { min: 2, max: 40, default: 8, about: 'The tracing grid, in scene units; smaller is finer' },
    },
    run: (p, seed) => contours(p as unknown as Parameters<typeof contours>[0], seed),
  },
  'dots.scatter': {
    about: 'Evenly spread dots, never closer than a spacing and without regular rows: a quiet texture, a crowd',
    closed: true,
    seeded: true,
    params: {
      x: X,
      y: X,
      width: SIZE,
      height: SIZE,
      spacing: { min: 4, max: 400, default: 16, about: 'The closest two dots come, in scene units' },
      radius: { min: 0.5, max: 40, default: 2, about: 'Each dot’s radius, in scene units' },
      max: { min: 1, max: 2000, default: 400, integer: true, about: 'The most dots' },
      round: { min: 0, max: 1, default: 0, integer: true, about: '1 keeps the dots inside the ellipse that fits the area' },
    },
    run: (p, seed) =>
      dotsPath(poissonDisc({ x: p['x'], y: p['y'], width: p['width'], height: p['height'], spacing: p['spacing'], max: p['max'], round: p['round'] === 1 }, seed), p['radius']),
  },
  'dots.grid': {
    about: 'Dots on a grid, each moved a little at random within its cell: order with a human touch',
    closed: true,
    seeded: true,
    params: {
      x: X,
      y: X,
      width: SIZE,
      height: SIZE,
      spacing: { min: 4, max: 400, default: 20, about: 'The size of a grid cell, in scene units' },
      jitter: { min: 0, max: 0.5, default: 0.2, about: 'How far a dot can move within its cell, as a share of the cell; 0 is a strict grid' },
      radius: { min: 0.5, max: 40, default: 2, about: 'Each dot’s radius, in scene units' },
    },
    run: (p, seed) =>
      dotsPath(jitteredGrid({ x: p['x'], y: p['y'], width: p['width'], height: p['height'], spacing: p['spacing'], jitter: p['jitter'] }, seed), p['radius']),
  },
  'curve.lens': {
    about: 'Where two circles overlap: the shared part of two translucent forms, drawn as its own shape',
    closed: true,
    seeded: false,
    params: {
      x1: X,
      y1: X,
      r1: SIZE,
      x2: X,
      y2: X,
      r2: SIZE,
    },
    run: ({ x1, y1, r1, x2, y2, r2 }) => lens([x1, y1], r1, [x2, y2], r2),
  },
} as const satisfies Record<string, GeneratorDef>;

export type GeneratorId = keyof typeof GENERATORS;

/** Everything wrong with a generator reference; empty when it's valid. Pure: used by the validator. */
export function generatorProblems(id: string, params: Readonly<Record<string, number>>): string[] {
  const def = (GENERATORS as Record<string, GeneratorDef>)[id];
  if (!def) return [`unknown generator '${id}'`];
  const problems: string[] = [];
  for (const [name, spec] of Object.entries(def.params)) {
    const value = params[name];
    if (value === undefined) {
      if (spec.default === undefined) problems.push(`'${id}' needs '${name}'`);
      continue;
    }
    if (!Number.isFinite(value) || value < spec.min || value > spec.max)
      problems.push(`'${id}': '${name}' must be from ${spec.min} to ${spec.max}`);
    if (spec.integer && !Number.isInteger(value)) problems.push(`'${id}': '${name}' must be a whole number`);
  }
  for (const name of Object.keys(params))
    if (!Object.hasOwn(def.params, name)) problems.push(`'${id}' has no parameter '${name}'`);
  return problems;
}

function withDefaults(def: GeneratorDef, params: Readonly<Record<string, number>>): Record<string, number> {
  const full: Record<string, number> = {};
  for (const [name, spec] of Object.entries(def.params)) full[name] = params[name] ?? spec.default ?? 0;
  return full;
}

/** Runs a generator with its defaults filled in. */
export function generate(id: GeneratorId, params: Readonly<Record<string, number>>, seed: string): string {
  const def: GeneratorDef = GENERATORS[id];
  return def.run(withDefaults(def, params), seed);
}

/** A generated plane's top silhouette, or null when the generator doesn't make planes. */
export function generateEdge(id: GeneratorId, params: Readonly<Record<string, number>>, seed: string): string | null {
  const def: GeneratorDef = GENERATORS[id];
  return def.edge ? def.edge(withDefaults(def, params), seed) : null;
}
