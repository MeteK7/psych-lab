import { VisualRequest } from '../../shared/visual/visual';
import { MciiStage, WishChoice } from './mcii-logic';

export type MciiScene = 'mcii.future' | 'mcii.contrast' | 'mcii.plan' | 'mcii.aside';

/**
 * Which scene each step asks for (docs/mcii-design.md §5). It takes only the stage and the final
 * choice, so typed text can't reach a visual source. The scene at "Look at both" doesn't depend
 * on the choice, because a picture must not react to a decision while it's being made.
 */
export function sceneFor(stage: MciiStage, choice: WishChoice | null): VisualRequest & { scene: MciiScene } {
  switch (stage) {
    case 'mcii_wish':
    case 'mcii_outcome':
      return { scene: 'mcii.future' };
    case 'mcii_obstacle':
    case 'mcii_decide':
      return { scene: 'mcii.contrast' };
    case 'mcii_plan':
    case 'mcii_close':
      return { scene: choice === 'set_aside' ? 'mcii.aside' : 'mcii.plan' };
  }
}
