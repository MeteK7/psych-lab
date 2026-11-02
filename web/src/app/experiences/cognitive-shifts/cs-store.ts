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
  /** Other readings chosen for the share, in order. */
  readonly others = signal<Pick[]>([]);
  readonly points = signal<Record<string, number>>({});
  readonly cs3NoneFit = signal(false);
}
