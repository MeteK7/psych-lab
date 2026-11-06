import { Injectable } from '@angular/core';

import { MCII } from '../../../content';
import { NO_VISUAL, Visual, VisualRequest, VisualSource } from '../../shared/visual/visual';
import { MciiPathScene } from './mcii-path-scene';

const { scenes } = MCII;

/** The built-in pictures, drawn in code. Another source is bound in one place: `mcii.ts`. */
@Injectable()
export class MciiBuiltInVisuals implements VisualSource {
  readonly id = 'builtin.v1';

  resolve({ scene }: VisualRequest): Promise<Visual> {
    return Promise.resolve(this.visualFor(scene));
  }

  private visualFor(scene: string): Visual {
    const picture = (alt: string, inputs: Record<string, unknown>): Visual => ({
      kind: 'component',
      component: MciiPathScene,
      inputs,
      alt,
    });
    switch (scene) {
      case 'mcii.future':
        return picture(scenes.future.alt, {});
      case 'mcii.contrast':
        return picture(scenes.contrast.alt, { wall: true });
      case 'mcii.plan':
        return picture(scenes.plan.alt, { wall: true, bridge: true });
      case 'mcii.aside':
        return picture(scenes.aside.alt, { faded: true });
      default:
        return NO_VISUAL;
    }
  }
}
