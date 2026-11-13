import { Composed, composeScene } from '../../composition/compose';
import type { Purpose, SceneElement } from '../../composition/scene';
import type { StyleRef, ThemeId } from '../../styling/vocabulary';

/**
 * Where a person is in the dot game's rounds ("Picture it, then follow the dot", "Follow the dot,
 * then plan"): one mark per round, above the game. Purpose: feedback on how much of the
 * 4.5 minutes is left, which the round heading gives only for the current round.
 *
 * It holds still during a round (it changes only between rounds), so it never competes with the
 * moving dot. Done rounds are filled, the current round is outlined in the Action colour and
 * heavier, and the rounds to come are thin outlines: shape and weight, never colour alone.
 * It carries no text: the heading and the cue say the round in words. A composition built from
 * data (composition/compose.ts). Policy assertions: `rounds.policy.spec.ts`.
 */
export const ROUNDS = { id: 'state-reset.rounds', version: 1, theme: 'action' as ThemeId } as const;

export interface RoundsInput {
  /** How many rounds there are. */
  total: number;
  /** The round being played or coming next, 1-based. Rounds before it are done. */
  current: number;
}

// Design size: the game's width, so the marks line up with the box under them.
export const ROUNDS_SIZE = { width: 480, height: 16 };
const GAP = 8;
const MARK_HEIGHT = 8;

/** Why each element is there (docs/visual-policy.md principle 6). */
export const ROUNDS_PURPOSES: readonly { id: string; purpose: Purpose }[] = [
  {
    id: 'round-*',
    purpose: {
      serves: ['feedback'],
      why: 'How much of the game is done and how much is left, at a glance, without reading the timer. Still during a round, so it never draws the eye from the dot.',
    },
  },
];

const DONE: StyleRef = { role: 'context', material: 'solid' };
const NOW: StyleRef = { role: 'subject', line: 'regular' };
const NEXT: StyleRef = { role: 'context', line: 'hair' };

export function composeRounds({ total, current }: RoundsInput): Composed {
  const width = (ROUNDS_SIZE.width - (total - 1) * GAP - 4) / total;
  const elements: SceneElement[] = [];
  for (let round = 1; round <= total; round++) {
    elements.push({
      kind: 'shape',
      id: `round-${round}`,
      geometry: {
        type: 'rect',
        x: 2 + (round - 1) * (width + GAP),
        y: (ROUNDS_SIZE.height - MARK_HEIGHT) / 2,
        width,
        height: MARK_HEIGHT,
        rx: MARK_HEIGHT / 2,
      },
      style: round < current ? DONE : round === current ? NOW : NEXT,
      purpose: ROUNDS_PURPOSES[0].purpose,
    });
  }
  return composeScene({
    id: ROUNDS.id,
    version: ROUNDS.version,
    theme: ROUNDS.theme,
    size: ROUNDS_SIZE,
    layers: [{ id: 'rounds', plane: 'annotation', elements }],
    ...(current >= 1 && current <= total ? { emphasis: { [`round-${current}`]: 'focal' as const } } : {}),
    alt: `Round ${current} of ${total}.`,
  });
}
