import type { Purpose } from '../../composition/scene';
import type { FrameItem, ResolvedFrame } from '../../rendering/frame';
import { resolveStyle } from '../../styling/resolve';
import type { ThemeId } from '../../styling/vocabulary';

/**
 * Where a person is in the dot game's rounds ("Picture it, then follow the dot", "Follow the dot,
 * then plan"): one mark per round, above the game. Purpose: feedback on how much of the
 * 4.5 minutes is left, which the round heading gives only for the current round.
 *
 * It holds still during a round (it changes only between rounds), so it never competes with the
 * moving dot. Done rounds are filled, the current round is outlined in the Action colour and
 * heavier, and the rounds to come are thin outlines: shape and weight, never colour alone.
 * It carries no text: the heading and the cue say the round in words. Policy assertions:
 * `rounds.policy.spec.ts`.
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

export function roundsFrame({ total, current }: RoundsInput): ResolvedFrame {
  const width = (ROUNDS_SIZE.width - (total - 1) * GAP - 4) / total;
  const done = resolveStyle({ role: 'context', material: 'solid' });
  const now = resolveStyle({ role: 'subject', line: 'regular' }, 'focal');
  const next = resolveStyle({ role: 'context', line: 'hair' });
  const items: FrameItem[] = [];
  for (let round = 1; round <= total; round++) {
    const paint = round < current ? done : round === current ? now : next;
    items.push({
      kind: 'shape',
      id: `round-${round}`,
      layer: 'rounds',
      shape: {
        type: 'rect',
        x: 2 + (round - 1) * (width + GAP),
        y: (ROUNDS_SIZE.height - MARK_HEIGHT) / 2,
        width,
        height: MARK_HEIGHT,
        rx: MARK_HEIGHT / 2,
      },
      paint,
    });
  }
  return { width: ROUNDS_SIZE.width, height: ROUNDS_SIZE.height, theme: ROUNDS.theme, items };
}

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
