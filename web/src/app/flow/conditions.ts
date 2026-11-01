import { Condition, Mode } from '../api/types';

export type StepId =
  | 'pre_rating'
  | 'state_reset'
  | 'game_only'
  | 'action_bridge'
  | 'goal_restatement'
  | 'post_rating';

const STEPS: Record<Condition, StepId[]> = {
  // n-of-1 phase 1: plan factor
  action_bridge: ['pre_rating', 'action_bridge', 'post_rating'],
  goal_restatement: ['pre_rating', 'goal_restatement', 'post_rating'],
  // n-of-1 phase 2: pre-task factor, Action Bridge held constant
  'state_reset+action_bridge': ['pre_rating', 'state_reset', 'action_bridge', 'post_rating'],
  'game_only+action_bridge': ['pre_rating', 'game_only', 'action_bridge', 'post_rating'],
};

export interface ConditionInfo {
  value: Condition;
  /** On-screen name of the experience; internal names stay in code and docs. */
  label: string;
  /** One line for the area page. */
  description: string;
  /** "What happens" steps shown before Begin. */
  summary: string[];
  minutes: number;
  experimental: boolean;
  /** Internal: the n-of-1 phase that compares this condition. Never shown on screen. */
  phase: 1 | 2;
}

export const CONDITIONS: ConditionInfo[] = [
  {
    value: 'action_bridge',
    label: 'Plan your first step',
    description: "Write when you'll start and the first small thing you'll do.",
    summary: [
      'Rate how starting feels.',
      'Write a short when-then plan and read it twice.',
      'Rate again.',
    ],
    minutes: 3,
    experimental: false,
    phase: 1,
  },
  {
    value: 'goal_restatement',
    label: 'Write down your goal',
    description: "Write your goal and what you'll work on today.",
    summary: [
      'Rate how starting feels.',
      "Write your goal and today's topic and read them twice.",
      'Rate again.',
    ],
    minutes: 3,
    experimental: false,
    phase: 1,
  },
  {
    value: 'state_reset+action_bridge',
    label: 'Picture it, then follow the dot',
    description:
      "Hold a picture of something you're reluctant to start while following a moving dot, then plan your first step.",
    summary: [
      'Rate how starting feels.',
      'Choose a picture, try the game, then play 8 short rounds while holding the picture.',
      'Plan your first step.',
      'Rate again.',
    ],
    minutes: 10,
    experimental: true,
    phase: 2,
  },
  {
    value: 'game_only+action_bridge',
    label: 'Follow the dot, then plan',
    description: 'A short dot-following game, then plan your first step.',
    summary: [
      'Rate how starting feels.',
      'Try the game, then play 8 short rounds.',
      'Plan your first step.',
      'Rate again.',
    ],
    minutes: 9,
    experimental: false,
    phase: 2,
  },
];

export const STEP_NAMES: Record<StepId, string> = {
  pre_rating: 'How starting feels',
  post_rating: 'How starting feels',
  action_bridge: 'Plan your first step',
  goal_restatement: 'Write down your goal',
  state_reset: 'Picture it, then follow the dot',
  game_only: 'Follow the dot',
};

// Usability mode belongs to level B and is not offered yet.
export const MODES: { value: Mode; label: string }[] = [
  { value: 'self_use', label: 'Experiment' },
  { value: 'dev', label: 'Practice' },
];

export function conditionInfo(value: Condition | string | null | undefined): ConditionInfo | undefined {
  return CONDITIONS.find((c) => c.value === value);
}

export function stepsFor(condition: Condition): StepId[] {
  return [...STEPS[condition]];
}

export function isCondition(value: unknown): value is Condition {
  return typeof value === 'string' && value in STEPS;
}

export function isLevelAMode(value: unknown): value is Mode {
  return MODES.some((m) => m.value === value);
}
