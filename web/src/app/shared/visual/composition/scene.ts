import type { GeneratorId } from '../generation/registry';
import type { Emphasis, FrameRatio, FrameSize, LabelTone, MotionEffect, StyleRef, ThemeId } from '../styling/vocabulary';

/**
 * S3 Composition: the Scene Specification, version 0 (docs/visual-system.md §4). A scene is typed
 * data: no DSL, no parser, no scenes from the server. Each section is read by one capability:
 * layers by composition, `states` by S4 State, and `enter` and `transitions` by S5 Motion.
 * It contains no colour values, durations or backend names.
 */
export type SceneId = string;
export type ElementId = string;
export type StateName = string;
/** A key into versioned content, e.g. 'mcii.scenes.future.alt'. */
export type ContentKey = string;
export type Point = readonly [number, number];

export type PlaneRole = 'backdrop' | 'far' | 'mid' | 'near' | 'subject' | 'annotation';

/**
 * Every element earns its place (docs/visual-policy.md §2): it serves at least one of these, and
 * says how. An element that can't name a purpose doesn't belong in the composition.
 */
export const PURPOSE_KINDS = ['concept', 'understanding', 'interaction', 'feedback', 'identity'] as const;
export type PurposeKind = (typeof PURPOSE_KINDS)[number];
export const PURPOSE_LABELS: Record<PurposeKind, string> = {
  concept: 'Communicates a psychological concept',
  understanding: 'Helps understand information or relationships',
  interaction: 'Supports an interaction',
  feedback: 'Gives feedback about a change of state',
  identity: 'Establishes visual identity without compromising clarity',
};

export interface Purpose {
  serves: readonly PurposeKind[];
  /** For reviewers: what the element tells the participant, and what would be lost without it. */
  why: string;
}

/** Literal geometry, in scene units (1 unit = 1 CSS px at the frame's design width). */
export type Geometry =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number };

/**
 * How an element appears when a state change shows it (read by S5). Without `enter` it fades in.
 * Motion earns its place like any element: an element that moves on its own says why.
 */
export type Entrance =
  /** Moves on its own, with an effect, and counts towards the motion budget. */
  | { effect: MotionEffect; why: string; with?: undefined }
  /** Moves as part of another element (its courses, its label), at the same moment. Default effect: the lead's (`fade` for a label led by `draw`). */
  | { with: ElementId; effect?: MotionEffect; why?: undefined };

/**
 * Ties between elements that some materials need (milestone M3), checked by the validator:
 * - `grounds`: a `shadow` names the object it sits under (drawn after it)
 * - `overlapOf`: an `overlap` names the two `translucent` forms whose overlap it is
 */
export interface Ties {
  grounds?: ElementId;
  overlapOf?: readonly [ElementId, ElementId];
}

/**
 * Scales (milestone M4, S6 Interaction): map a value the exercise holds to a position along one axis
 * of the figure, in scene units, and a position back to a value.
 * - `linear`: numbers from `domain[0]` to `domain[1]`, at `range[0]` to `range[1]`; with a `step`,
 *   only whole steps from `domain[0]` (a 1–5 rating has step 1).
 * - `points`: a few values, evenly spaced from `range[0]` to `range[1]` (categories, in order).
 * A range may run either way: a vertical scale often runs upwards.
 */
export type ScaleId = string;
export type ScaleDef =
  | { kind: 'linear'; domain: readonly [number, number]; range: readonly [number, number]; step?: number }
  | { kind: 'points'; values: readonly (string | number)[]; range: readonly [number, number] };
export type ScaleValue = string | number;

/** One axis of a handle: the scale it moves along, and the name of the exercise's value it sets. */
export interface Axis {
  scale: ScaleId;
  value: string;
}

/**
 * What a pointer can do with an element (M4). A target's purpose serves `interaction`.
 * - `handle`: moved along one scale (`x` or `y`) or two; a click on its `track` (the line or area
 *   it moves in) places it there, so no drag is ever needed.
 * - `region`: chosen as a whole; choosing it sets `value` to `option`.
 * `label` names the target in words, for the exercise's controls and for assistive technology.
 */
export type Target =
  | { kind: 'handle'; x?: Axis; y?: Axis; track?: ElementId; label: ContentKey }
  | { kind: 'region'; value: string; option: ScaleValue; label: ContentKey };

export type SceneElement =
  | ({ kind: 'shape'; id: ElementId; geometry: Geometry; style: StyleRef; purpose: Purpose; enter?: Entrance; target?: Target } & Ties)
  /**
   * Geometry made by an S2 generator (milestone M2) from its parameters and the element's own seed,
   * derived from the scene's seed and the element's id. Drawn, styled and animated like a shape.
   */
  | ({
      kind: 'generated';
      id: ElementId;
      generator: GeneratorId;
      params: Readonly<Record<string, number>>;
      style: StyleRef;
      purpose: Purpose;
      enter?: Entrance;
      target?: Target;
    } & Ties)
  | {
      kind: 'label';
      id: ElementId;
      text: ContentKey;
      at: Point;
      align: 'start' | 'middle' | 'end';
      tone?: LabelTone;
      /** Bold marks the one item a person is working on (an instrument's current value). */
      weight?: 'bold';
      /**
       * Wraps the text within this width, in scene units, at spaces, lines 1.2 apart (M3). `at` is
       * then the first line's baseline. Without it, the label is one line.
       */
      width?: number;
      /** A halo in the ground colour behind the glyphs, so the label stays readable over a plane and across its edge (M3). */
      halo?: boolean;
      /** The forms the label names: it may sit closer to them than the 8-unit clearance (§9), e.g. a number inside its mark. */
      names?: readonly ElementId[];
      purpose: Purpose;
      enter?: Entrance;
    };

export interface Layer {
  id: string;
  plane: PlaneRole;
  elements: readonly SceneElement[];
}

/** Read only by S4. Elements not listed in `visible` are hidden in that state. */
export interface StateDef {
  visible: readonly ElementId[];
  /** Default `normal`. */
  emphasis?: Readonly<Partial<Record<ElementId, Exclude<Emphasis, 'normal'>>>>;
}

export interface StateModel {
  initial: StateName;
  states: Readonly<Record<StateName, StateDef>>;
}

export interface SceneDefinition {
  id: SceneId;
  /** Bumped on any visible change; recorded with a shown visual. */
  version: number;
  theme: ThemeId;
  /** Seeds every generated element (each derives its own from this and its id). Required when the scene has one. */
  seed?: string;
  /** A named frame, or an explicit size for a composition built from data (composition/compose.ts). */
  frame: FrameRatio | FrameSize;
  layers: readonly Layer[];
  states: StateModel;
  /** The text alternative for each state. */
  alt: Readonly<Record<StateName, ContentKey>>;
  /**
   * The state changes the exercise makes, from → to. S5 checks the motion budget for each, and the
   * Visual Lab replays each for review. Other changes still work; they just aren't reviewed.
   */
  transitions?: readonly (readonly [StateName, StateName])[];
  /** The scales its handles move along (M4). */
  scales?: Readonly<Record<ScaleId, ScaleDef>>;
  /** Scene policy settings the validator reads (docs/visual-policy.md §8). */
  policy?: { maxFocal?: number };
  /**
   * What the composition changes compared with the picture it replaces, for reviewers. Shown in
   * the Visual Lab next to the comparison.
   */
  changes?: readonly string[];
}

/** Looks up a content key; undefined when the key doesn't exist. */
export type TextLookup = (key: ContentKey) => string | undefined;

export function elementsOf(scene: SceneDefinition): { layer: Layer; element: SceneElement }[] {
  return scene.layers.flatMap((layer) => layer.elements.map((element) => ({ layer, element })));
}
