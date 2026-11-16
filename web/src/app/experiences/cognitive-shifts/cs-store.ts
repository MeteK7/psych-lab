import { Injectable, signal } from '@angular/core';

import { CausePosition, Column } from './cs-logic';

/** A reading or cause picked from a card, or written by the person ("own"). */
export interface Pick {
  /** Card id, or 'own' for text the person wrote. */
  id: string;
  /** Shown back during the exercise only; never part of any saved record. */
  text: string;
}

export interface Cause extends Pick, CausePosition {}

/**
 * State of a Cognitive shifts exercise across its screens. Provided by the session page, so
 * it lives exactly as long as one exercise. Free text stays here and is never emitted: each
 * step reports card ids, counts and ratings only.
 */
@Injectable()
export class CsStore {
  // CS1 · Other ways to read it
  readonly firstReading = signal<(Pick & { kind: 'self' | 'situation' | 'own' }) | null>(null);
  readonly control = signal<'yes' | 'partly' | 'no' | null>(null);
  /** The step 2 ratings, shown again beside the step 5 ratings of the same reading. */
  readonly beliefBefore = signal<number | null>(null);
  readonly upsetBefore = signal<number | null>(null);
  /** One reading per lens (null = "Nothing comes to mind"). */
  readonly lensReadings = signal<(Pick | null)[]>([]);
  /** Where each reading sits on the fit board: 'first' or a lens index. */
  readonly placements = signal<Record<string, Column>>({});
  readonly noneFit = signal(false);

  // CS2 · Why did it happen?
  readonly setback = signal('');
  readonly causes = signal<Cause[]>([]);

  // CS3 · Not enough to go on
  readonly scenario = signal<Pick | null>(null);
  readonly cs3First = signal<Pick | null>(null);
  /** The step 2 rating, shown again beside the step 5 rating of the same reading. */
  readonly cs3CertaintyBefore = signal<number | null>(null);
  /** Ids of the readings ticked as "could also explain what happened". */
  readonly cs3Fits = signal<string[]>([]);
  readonly cs3SomethingElse = signal(false);
  /** The person's own extra reading; its text is never saved. */
  readonly cs3Own = signal<Pick | null>(null);
  readonly cs3Find = signal<string | null>(null);

  // Change the camera angle (docs/camera-angle-design.md). Everything written stays here.
  readonly camMoment = signal('');
  readonly camUpsetBefore = signal<number | null>(null);
  /** Step 2: what happened and what was felt; empty when skipped or left blank. */
  readonly camOwnEyes = signal('');
  /** Step 3: where the person stopped, 0 (own eyes) to 3 (furthest back). */
  readonly camPosition = signal(0);
  /** Step 4, observer path: the reflection on why. */
  readonly camWatch = signal('');
  /** Step 4: the options ticked, by id. */
  readonly camNoticed = signal<string[]>([]);
  /** Step 4, observer path: "Add your own", its text never saved. */
  readonly camOwnNotice = signal('');
  readonly camControl = signal<'yes' | 'partly' | 'no' | null>(null);
}
