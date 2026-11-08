/**
 * S7 Rendering: the resolved frame, the only input a backend gets (docs/visual-system.md §6.2).
 * Everything in it is decided: geometry, paint and text. A backend never sees a scene, a state
 * name, a theme's values or an exercise, and makes no decisions of its own.
 */
export interface DrawPaint {
  fill: string;
  stroke: string;
  width: number;
  dash: string | null;
}

export type Drawable =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number };

export type FrameItem =
  | { kind: 'shape'; id: string; layer: string; shape: Drawable; paint: DrawPaint }
  | {
      kind: 'text';
      id: string;
      layer: string;
      text: string;
      x: number;
      y: number;
      anchor: 'start' | 'middle' | 'end';
      fill: string;
      size: number;
      /** Bold marks the one item a person is working on (an instrument's current value). Default normal. */
      weight?: 'bold';
    };

export interface ResolvedFrame {
  width: number;
  height: number;
  /** The theme attribute that selects the area ramp on the surface. */
  theme: string;
  /** Visible items, in drawing order. */
  items: readonly FrameItem[];
}

/**
 * A timeline as a backend gets it: every value decided. `opacity`, `offsetY` (scene units, positive
 * is lower) and `reveal` (the drawn fraction along the element's direction) are numbers; `paint`
 * eases between two paints. The frame holds each element's final state; a backend plays tracks
 * towards it and, when it can't play them, simply shows the frame.
 */
interface TrackTiming {
  id: string;
  delay: number;
  duration: number;
  easing: string;
}

export type ResolvedTrack = TrackTiming &
  (
    | { property: 'opacity' | 'offsetY' | 'reveal'; from: number; to: number }
    | { property: 'paint'; from: DrawPaint; to: DrawPaint }
  );

export type ResolvedTimeline = readonly ResolvedTrack[];
