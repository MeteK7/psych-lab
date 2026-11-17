import { AREA_FIGURES, MCII } from '../../../../content';
import { SceneDefinition, TextLookup } from '../composition/scene';
import { contentText } from '../integration/content-text';
import { ACTION_CARDS } from './action/cards.scene';
import { MCII_PATH } from './action/mcii-path.scene';
import { COGNITIVE_CARDS } from './cognitive/cards.scene';

/** Every composition in the platform, with where its text comes from. The Visual Lab and the specs enumerate this. */
export interface SceneEntry {
  scene: SceneDefinition;
  text: TextLookup;
}

const cardText = contentText({ figures: AREA_FIGURES });

export const SCENES: readonly SceneEntry[] = [
  { scene: MCII_PATH, text: contentText({ mcii: MCII }) },
  // The figures on the area pages' exercise cards (scenes/cards.ts).
  ...[...COGNITIVE_CARDS, ...ACTION_CARDS].map((scene) => ({ scene, text: cardText })),
];

