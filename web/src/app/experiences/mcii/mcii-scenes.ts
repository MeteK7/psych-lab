import { VisualRequest } from '../../shared/visual/visual';
import { MCII_STAGES, MciiStage, WishChoice } from './mcii-logic';

export type MciiScene = 'mcii.future' | 'mcii.contrast' | 'mcii.plan' | 'mcii.aside';

/**
 * Which scene each step asks for (docs/mcii-design.md §5). It takes only the stage and the final
 * choice, so typed text can't reach a visual source. The scene at "Look at both" doesn't depend
 * on the choice, because a picture must not react to a decision while it's being made.
 * When the step before showed a different scene, `facets.from` names it, so the picture can show
 * what this step adds (the steps are recreated, so the picture can't remember it itself).
 */
export function sceneFor(stage: MciiStage, choice: WishChoice | null): VisualRequest & { scene: MciiScene } {
  const scene = sceneAt(stage, choice);
  const before = MCII_STAGES[MCII_STAGES.indexOf(stage) - 1];
  const from = before ? sceneAt(before, choice) : null;
  return from && from !== scene ? { scene, facets: { from } } : { scene };
}

function sceneAt(stage: MciiStage, choice: WishChoice | null): MciiScene {
  switch (stage) {
    case 'mcii_wish':
    case 'mcii_outcome':
      return 'mcii.future';
    case 'mcii_obstacle':
    case 'mcii_decide':
      return 'mcii.contrast';
    case 'mcii_plan':
    case 'mcii_close':
      return choice === 'set_aside' ? 'mcii.aside' : 'mcii.plan';
  }
}
