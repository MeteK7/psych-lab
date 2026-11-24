import { CheckedFigure, elementsOf } from '../../../shared/visual';
import type { Figure } from './idioms/contract';
import { samples } from './study-page';
import { kit } from '../../../shared/visual';
const { citesOf } = kit;

/**
 * STUDY CODE, Stage 3 M1: the study's figures in the engine's terms, so the engine's own checks (S12:
 * `figureProblems`) can be run on them. Since M3 the study's representations are v1 representations.
 */

/**
 * A study figure as the engine's invariants see it: its sampled moments, its compositions, and each
 * element's citations, which the study writes into the purpose text (`[s1,q3] …`) and the engine
 * carries as a separate map.
 */
export function toChecked(f: Figure): CheckedFigure {
  return {
    moments: samples(f),
    draw(at: number) {
      const composed = f.compose(at);
      return { composed, cites: Object.fromEntries(elementsOf(composed.scene).map(({ element }) => [element.id, citesOf(element.purpose)])) };
    },
    coverage: f.coverage,
  };
}
