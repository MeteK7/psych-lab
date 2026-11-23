import type { ThemeId } from '../../../shared/visual/styling/vocabulary';
import { CASES, StudyCase } from './cases';
import { FINISH, merged } from './finish';
import type { Figure, IdiomId } from './idioms/contract';
import { field } from './idioms/field';
import { kinetic } from './idioms/kinetic';
import { spatial } from './idioms/spatial';
import { Refusal, attempt } from './idioms/registry';
import { UNSEEN } from './unseen';

/** STUDY CODE: every depth figure, by the rules and finished (docs/visual-study/README.md). */
export interface Direction {
  case: StudyCase;
  idiom: IdiomId;
  rules: Figure;
  finished: Figure;
  adjustments: readonly { id: string; kind: string; what: string; why: string }[];
}

export const IDIOMS: readonly IdiomId[] = ['spatial', 'kinetic', 'field'];

/**
 * Style packs (pass C step 4): which of the engine's colour ramps each domain is drawn in. `areas` is
 * the study's own: education and planning borrow psychology's area themes (PL-3). `subjects` is a
 * second pack, named for subjects rather than areas. Since Stage 3 M0 the themes come from the app's style pack (`app/visual-pack.ts`); this pack still
 * pack can only re-map domains onto its five ramps; a new ramp would be an engine change.
 */
export const PACKS: Record<'areas' | 'subjects', Record<StudyCase['domain'], ThemeId | null>> = {
  areas: { psychology: null, education: null, 'project management': null },
  subjects: { psychology: null, education: 'regulation', 'project management': 'action' },
};
export type PackId = keyof typeof PACKS;

export function packed(c: StudyCase, pack: PackId): StudyCase {
  const theme = PACKS[pack][c.domain];
  return theme ? { ...c, theme } : c;
}

export function directions(pack: PackId = 'areas'): Direction[] {
  return CASES.map((c) => packed(c, pack)).flatMap((c) =>
    IDIOMS.map((idiom): Direction => {
      const f = FINISH[c.id] ?? { spatial: [], kinetic: [], field: [] };
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

/** R4-4 under evaluation: the four treatments for an amount the text doesn't give. */
export const UNSCALED = ['constant', 'labelled', 'range', 'break'] as const;
export type UnscaledId = (typeof UNSCALED)[number];

export interface UnscaledVariant {
  case: StudyCase;
  idiom: IdiomId;
  treatment: UnscaledId;
  figure: Figure;
}

/**
 * Every figure with an unspecified amount (a `shifts`, `exceeds` or `behind` statement), finished,
 * under each treatment. Nothing is adopted: `constant` stays the rules' default until the user looks.
 */
export function unscaledVariants(): UnscaledVariant[] {
  const amounts = new Set(['shifts', 'exceeds', 'behind']);
  return CASES.filter((c) => c.rep.statements.some((s) => amounts.has(s.say.p))).flatMap((c) =>
    IDIOMS.flatMap((idiom) =>
      UNSCALED.map((treatment): UnscaledVariant => {
        const f = FINISH[c.id] ?? { spatial: [], kinetic: [], field: [] };
        const figure =
          idiom === 'spatial'
            ? spatial(c, { ...merged(f.spatial), unscaled: treatment })
            : idiom === 'kinetic'
              ? kinetic(c, { ...merged(f.kinetic), unscaled: treatment })
              : field(c, { ...merged(f.field), unscaled: treatment });
        return { case: c, idiom, treatment, figure };
      }),
    ),
  );
}

/** Revision 5: each unseen case in each idiom, by the rules: its figure, or the idiom's refusal. */
export interface UnseenDirection {
  case: StudyCase;
  idiom: IdiomId;
  drawn: Figure | Refusal;
}

export function unseenDirections(): UnseenDirection[] {
  return UNSEEN.flatMap((c) =>
    IDIOMS.map((idiom): UnseenDirection => ({ case: c, idiom, drawn: attempt(() => (idiom === 'spatial' ? spatial(c) : idiom === 'kinetic' ? kinetic(c) : field(c))) })),
  );
}
