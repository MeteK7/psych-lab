import { Injectable, signal } from '@angular/core';

import { Obstacle, WishChoice } from './mcii-logic';

/**
 * State of the MCII exercise across its screens. Provided by the session page, so it lives exactly
 * as long as one exercise. Free text stays here and is never emitted: each step reports ids,
 * choices and ratings only.
 */
@Injectable()
export class MciiStore {
  readonly wish = signal('');
  readonly outcome = signal('');
  readonly obstacle = signal<Obstacle | null>(null);
  /** The step 1 rating, shown beside the step 4 rating of the same wish, after it's given. */
  readonly likelyBefore = signal<number | null>(null);
  readonly choice = signal<WishChoice | null>(null);
  /** The finished plan sentence; empty until there is one. */
  readonly plan = signal('');
}
