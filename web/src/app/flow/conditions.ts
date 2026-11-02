import { Condition, Mode } from '../api/types';
import { EXERCISES, ExerciseInfo, exerciseInfo } from '../experiences/registry';

export type StepId =
  | 'pre_rating'
  | 'state_reset'
  | 'game_only'
  | 'action_bridge'
  | 'goal_restatement'
  | 'post_rating'
  // Cognitive shifts: one step per screen; the exercise keeps its state in CsStore.
  | 'cs1_first'
  | 'cs1_feel_before'
  | 'cs1_lenses'
  | 'cs1_sort'
  | 'cs1_feel_after'
  | 'cs1_close'
  | 'cs2_setback'
  | 'cs2_first'
  | 'cs2_more'
  | 'cs2_map'
  | 'cs2_reflect'
  | 'cs2_change'
  | 'cs3_situation'
  | 'cs3_first'
  | 'cs3_share'
  | 'cs3_find'
  | 'cs3_after';

/** An experiment exercise: one of the n-of-1 conditions (protocol-n-of-1.md). */
export type ConditionInfo = ExerciseInfo & { value: Condition; experiment: 1 | 2 };

/** The experiment's four conditions, read from the exercise registry. */
export const CONDITIONS = EXERCISES.filter((e): e is ConditionInfo => e.experiment !== null);

export const STEP_NAMES: Record<StepId, string> = {
  pre_rating: 'How starting feels',
  post_rating: 'How starting feels',
  action_bridge: 'Plan your first step',
  goal_restatement: 'Write down your goal',
  state_reset: 'Picture it, then follow the dot',
  game_only: 'Follow the dot',
  cs1_first: 'Your first reading',
  cs1_feel_before: 'How it feels now',
  cs1_lenses: 'Other ways to see it',
  cs1_sort: 'Which readings fit?',
  cs1_feel_after: 'How it feels now',
  cs1_close: "What you're keeping",
  cs2_setback: 'The setback',
  cs2_first: 'Why do you think it happened?',
  cs2_more: 'Other possible causes',
  cs2_map: 'Place each cause',
  cs2_reflect: 'What the map shows',
  cs2_change: 'Anything to change?',
  cs3_situation: 'An unclear situation',
  cs3_first: 'Your first reading',
  cs3_share: 'How likely is each?',
  cs3_find: 'Is there a way to find out?',
  cs3_after: 'How sure are you now?',
};

// Usability mode belongs to level B and is not offered yet.
export const MODES: { value: Mode; label: string }[] = [
  { value: 'self_use', label: 'Experiment' },
  { value: 'try', label: 'Practice' },
  { value: 'dev', label: 'Test' },
];

/** Experiment exercises only; for any exercise, use exerciseInfo from the registry. */
export function conditionInfo(value: Condition | string | null | undefined): ConditionInfo | undefined {
  const info = exerciseInfo(value);
  return info?.experiment ? (info as ConditionInfo) : undefined;
}

export function isCondition(value: unknown): value is Condition {
  return CONDITIONS.some((c) => c.value === value);
}

export function isLevelAMode(value: unknown): value is Mode {
  return MODES.some((m) => m.value === value);
}
