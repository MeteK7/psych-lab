import { MCII } from '../../../../content';
import { SceneDefinition, TextLookup } from '../composition/scene';
import { contentText } from '../integration/pipeline';
import { MCII_PATH } from './action/mcii-path.scene';

/** Every composition in the platform, with where its text comes from. The Visual Lab and the specs enumerate this. */
export interface SceneEntry {
  scene: SceneDefinition;
  text: TextLookup;
}

export const SCENES: readonly SceneEntry[] = [{ scene: MCII_PATH, text: contentText({ mcii: MCII }) }];
