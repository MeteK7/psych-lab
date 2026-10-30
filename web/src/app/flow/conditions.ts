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

export const CONDITIONS: { value: Condition; label: string; phase: 1 | 2 }[] = [
  { value: 'action_bridge', label: 'Action Bridge', phase: 1 },
  { value: 'goal_restatement', label: 'Goal restatement', phase: 1 },
  { value: 'state_reset+action_bridge', label: 'State Reset, then Action Bridge', phase: 2 },
  { value: 'game_only+action_bridge', label: 'Game only, then Action Bridge', phase: 2 },
];

// Usability mode belongs to level B and is not offered yet.
export const MODES: { value: Mode; label: string }[] = [
  { value: 'self_use', label: 'My own use (n-of-1)' },
  { value: 'dev', label: 'Development / trying it out' },
];

export function stepsFor(condition: Condition): StepId[] {
  return [...STEPS[condition]];
}

export function isCondition(value: unknown): value is Condition {
  return typeof value === 'string' && value in STEPS;
}

export function isLevelAMode(value: unknown): value is Mode {
  return MODES.some((m) => m.value === value);
}
