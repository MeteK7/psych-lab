import type { Emphasis, FrameRatio, LabelTone, MotionEffect, StyleRef, ThemeId } from '../styling/vocabulary';

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

export type SceneElement =
  | { kind: 'shape'; id: ElementId; geometry: Geometry; style: StyleRef; purpose: Purpose; enter?: Entrance }
  | {
      kind: 'label';
      id: ElementId;
      text: ContentKey;
      at: Point;
      align: 'start' | 'middle' | 'end';
      tone?: LabelTone;
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
  frame: FrameRatio;
  layers: readonly Layer[];
  states: StateModel;
  /** The text alternative for each state. */
  alt: Readonly<Record<StateName, ContentKey>>;
  /**
   * The state changes the exercise makes, from → to. S5 checks the motion budget for each, and the
   * Visual Lab replays each for review. Other changes still work; they just aren't reviewed.
   */
  transitions?: readonly (readonly [StateName, StateName])[];
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
