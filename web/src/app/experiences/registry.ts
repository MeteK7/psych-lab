import { ExerciseId } from '../api/types';
import type { StepId } from '../flow/conditions';
import { IconName } from '../shared/icon';

/**
 * Every exercise the platform offers (plan §6.1: a registry once there are more than about
 * five). The session runner, area pages and records read exercises from here.
 *
 * The four experiment exercises were moved here unchanged from flow/conditions.ts; golden
 * tests (flow/golden.spec.ts) pin their saved records and screens.
 */
export interface ExerciseInfo {
  value: ExerciseId;
  /** On-screen name of the experience; internal names stay in code and docs. */
  label: string;
  /** One line for the area page. */
  description: string;
  /** "What happens" steps shown before Begin. */
  summary: string[];
  minutes: number;
  experimental: boolean;
  /** The scientific method the exercise rests on, shown on its card (plan §3.1). */
  method: { name: string; icon: IconName };
  /** The steps the session runner shows, in order. */
  steps: StepId[];
  /**
   * Internal: the n-of-1 phase that compares this exercise, or null if it is never part of
   * the experiment (Try it only). Never shown on screen.
   */
  experiment: 1 | 2 | null;
  /** The area whose page lists it (areas.ts). */
  area: 'action-growth' | 'cognitive-shifts';
  /**
   * released: offered wherever its area is. development: shown only in the development
   * build until its release gates pass (content review, full texts).
   */
  release: 'released' | 'development';
}

export const EXERCISES: ExerciseInfo[] = [
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
    method: { name: 'Implementation intentions', icon: 'route' },
    // n-of-1 phase 1: plan factor
    steps: ['pre_rating', 'action_bridge', 'post_rating'],
    experiment: 1,
    area: 'action-growth',
    release: 'released',
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
    method: { name: 'Goal intentions', icon: 'flag' },
    steps: ['pre_rating', 'goal_restatement', 'post_rating'],
    experiment: 1,
    area: 'action-growth',
    release: 'released',
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
    method: { name: 'Working-memory taxation', icon: 'layers' },
    // n-of-1 phase 2: pre-task factor, Action Bridge held constant
    steps: ['pre_rating', 'state_reset', 'action_bridge', 'post_rating'],
    experiment: 2,
    area: 'action-growth',
    release: 'released',
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
    method: { name: 'Distraction', icon: 'focus' },
    steps: ['pre_rating', 'game_only', 'action_bridge', 'post_rating'],
    experiment: 2,
    area: 'action-growth',
    release: 'released',
  },
  // Cognitive shifts (docs/cognitive-shifts-design.md): Try it only, never in the experiment.
  {
    value: 'cs_other_readings',
    label: 'Other ways to read it',
    description: 'Look at a situation through three lenses and sort the readings by how well they fit.',
    summary: [
      'Say how you read the situation now.',
      'Look at it through three different lenses.',
      'Sort the readings by how well they fit.',
      'Rate how it feels now.',
    ],
    minutes: 5,
    experimental: false,
    method: { name: 'Reappraisal', icon: 'lens' },
    steps: ['cs1_first', 'cs1_feel_before', 'cs1_lenses', 'cs1_sort', 'cs1_feel_after', 'cs1_close'],
    experiment: null,
    area: 'cognitive-shifts',
    release: 'development',
  },
  {
    value: 'cs_why_it_happened',
    label: 'Why did it happen?',
    description: 'Collect possible causes and place them on a map.',
    summary: [
      'Name a recent mistake or setback.',
      'Collect possible causes.',
      'Place each cause on a map.',
      'Choose what, if anything, to change.',
    ],
    minutes: 5,
    experimental: false,
    method: { name: 'Attributional reframing', icon: 'causes' },
    steps: ['cs2_setback', 'cs2_first', 'cs2_more', 'cs2_map', 'cs2_reflect', 'cs2_change'],
    experiment: null,
    area: 'cognitive-shifts',
    release: 'development',
  },
  {
    value: 'cs_not_enough_to_go_on',
    label: 'Not enough to go on',
    description: 'Share out the chances between readings, then decide how to find out.',
    summary: [
      'Pick an unclear situation.',
      "Say how you read it, and how sure you are.",
      'Share out the chances between possible readings.',
      'Decide whether and how to find out.',
    ],
    minutes: 4,
    experimental: false,
    method: { name: 'Perspective-getting', icon: 'question' },
    steps: ['cs3_situation', 'cs3_first', 'cs3_share', 'cs3_find', 'cs3_after'],
    experiment: null,
    area: 'cognitive-shifts',
    release: 'development',
  },
];

export function exerciseInfo(value: string | null | undefined): ExerciseInfo | undefined {
  return EXERCISES.find((e) => e.value === value);
}

export function isExerciseId(value: unknown): value is ExerciseId {
  return EXERCISES.some((e) => e.value === value);
}

/** A copy, so callers can't change the definitions. */
export function stepsFor(exercise: ExerciseId): StepId[] {
  return [...(exerciseInfo(exercise)?.steps ?? [])];
}
