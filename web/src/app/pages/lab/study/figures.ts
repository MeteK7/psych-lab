import { CASES, StudyCase } from './cases';
import { FINISH, merged } from './finish';
import type { Figure, IdiomId } from './idioms/contract';
import { field } from './idioms/field';
import { kinetic } from './idioms/kinetic';
import { spatial } from './idioms/spatial';

/** STUDY CODE: every depth figure, by the rules and finished (docs/visual-study/README.md). */
export interface Direction {
  case: StudyCase;
  idiom: IdiomId;
  rules: Figure;
  finished: Figure;
  adjustments: readonly { id: string; kind: string; what: string; why: string }[];
}

export const IDIOMS: readonly IdiomId[] = ['spatial', 'kinetic', 'field'];

export function directions(): Direction[] {
  return CASES.flatMap((c) =>
    IDIOMS.map((idiom): Direction => {
      const f = FINISH[c.id];
      switch (idiom) {
        case 'spatial':
          return { case: c, idiom, rules: spatial(c), finished: spatial(c, merged(f.spatial)), adjustments: f.spatial };
        case 'kinetic':
          return { case: c, idiom, rules: kinetic(c), finished: kinetic(c, merged(f.kinetic)), adjustments: f.kinetic };
        case 'field':
          return { case: c, idiom, rules: field(c), finished: field(c, merged(f.field)), adjustments: f.field };
      }
    }),
  );
}
