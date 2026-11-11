import { InjectionToken, Type } from '@angular/core';

/**
 * The visual contract (docs/mcii-design.md §5). An exercise asks for a scene; a source decides what
 * to show. Nothing here names a provider or a technology, so a source can be swapped by binding
 * another one, with no change to an exercise's steps, rules, records or texts.
 */

/** What an exercise asks for. Closed vocabularies only: a request never carries typed text. */
export interface VisualRequest {
  /** Declared by the exercise, e.g. 'mcii.contrast'. */
  scene: string;
  facets?: Record<string, string>;
}

export type Visual =
  | { kind: 'component'; component: Type<unknown>; inputs?: Record<string, unknown>; alt: string }
  | { kind: 'image'; src: string; srcDark?: string; alt: string; width: number; height: number }
  | { kind: 'none' };

export interface VisualSource {
  /** Recorded with the session, so visuals could be compared later, e.g. 'scene:mcii.path@4;theme:action@1'. */
  readonly id: string;
  resolve(request: VisualRequest): Promise<Visual>;
}

export const VISUAL_SOURCE = new InjectionToken<VisualSource>('VISUAL_SOURCE');

/** Showing nothing is always a valid result: a missing, failing or slow source never holds up a step. */
export const NO_VISUAL: Visual = { kind: 'none' };

export function resolveWithin(
  source: VisualSource | null,
  request: VisualRequest,
  timeoutMs: number,
): Promise<Visual> {
  if (!source) return Promise.resolve(NO_VISUAL);
  return new Promise((done) => {
    const timer = setTimeout(() => done(NO_VISUAL), timeoutMs);
    const finish = (visual: Visual) => {
      clearTimeout(timer);
      done(visual);
    };
    try {
      source.resolve(request).then(finish, () => finish(NO_VISUAL));
    } catch {
      finish(NO_VISUAL);
    }
  });
}
