import { ExerciseId } from './api/types';

/**
 * The platform's areas, shown on Home. Planned areas are directions, not commitments;
 * research may rename, merge or replace them, so they live here as data rather than in
 * page code.
 */
export interface Topic {
  title: string;
  text: string;
  experiences: ExerciseId[];
  /** Whether My experiment runs on this topic. */
  hasExperiment: boolean;
  /** The note under this topic's exercises, when it differs from the area's. */
  practiceNote?: string;
}

export interface Area {
  id: string;
  title: string;
  text: string;
  /** development: shown as available in the development build only, planned elsewhere. */
  status: 'available' | 'planned' | 'development';
  intro?: string;
  /** The note under the exercises; defaults to the Action and growth wording. */
  practiceNote?: string;
  topics?: Topic[];
}

export const AREAS: Area[] = [
  {
    id: 'action-growth',
    title: 'Action and growth',
    text: "Move from intention to action. Plan a first step and get started on what you've been putting off.",
    status: 'available',
    intro: 'Experiences for moving from intention to action.',
    topics: [
      {
        title: 'Getting started on learning',
        text: 'For moments when you mean to start learning but keep putting it off.',
        experiences: [
          'action_bridge',
          'goal_restatement',
          'state_reset+action_bridge',
          'game_only+action_bridge',
        ],
        hasExperiment: true,
      },
      {
        // Development only until its gates pass (docs/mcii-design.md §7).
        title: 'Choosing what to go after',
        text: "For something you want, when you're not sure what's in the way or whether to go for it.",
        experiences: ['mcii'],
        hasExperiment: false,
        practiceNote:
          "Practice exercises are saved in My records, without anything you write. They're never part of your experiment.",
      },
    ],
  },
  {
    id: 'cognitive-shifts',
    title: 'Cognitive shifts',
    text: 'Find other ways to see difficulties, mistakes, setbacks and unclear situations.',
    // Development only until the content review and full-text gates pass
    // (docs/cognitive-shifts-design.md §9).
    status: 'development',
    intro:
      "Exercises for looking at a situation from more than one side, and keeping the reading that fits best, even if it's the first one.",
    practiceNote:
      "Practice exercises are saved in My records, without anything you write. They're never part of your experiment.",
    topics: [
      {
        title: "When you're stuck on one reading",
        text: 'For situations you keep seeing one way.',
        experiences: ['cs_other_readings'],
        hasExperiment: false,
      },
      {
        title: 'After a mistake or setback',
        text: 'For when something went wrong and it feels like proof.',
        experiences: ['cs_why_it_happened'],
        hasExperiment: false,
      },
      {
        title: 'When things are unclear',
        text: "For when you don't know what someone meant.",
        experiences: ['cs_not_enough_to_go_on'],
        hasExperiment: false,
      },
    ],
  },
  {
    id: 'attention',
    title: 'Attention',
    text: 'Interactive visual tasks built around specific attention processes.',
    status: 'planned',
  },
  {
    id: 'emotional-regulation',
    title: 'Emotional regulation',
    text: 'Guided exercises for everyday stress and difficult feelings.',
    status: 'planned',
  },
  {
    id: 'recovery',
    title: 'Recovery after setbacks',
    text: 'Reflect on a setback and return to what you chose to do.',
    status: 'planned',
  },
  {
    id: 'curiosity',
    title: 'Curiosity and exploration',
    text: 'Explore unfamiliar ideas and engage with challenging material.',
    status: 'planned',
  },
  {
    id: 'learning-reinforcement',
    title: 'Learning reinforcement',
    text: 'Practice, recall and retention techniques supported by research.',
    status: 'planned',
  },
];

/** Cross-area, so it isn't an area itself. */
export const PLANNED_GUIDE = {
  title: 'A conversation guide (optional)',
  text: 'Talk through what you need and find a fitting experience. The experiences will always work without it.',
};

/** Only available areas have a page; planned ones are shown on Home as cards. */
export function areaById(id: string | null, showDevelopment = false): Area | undefined {
  return AREAS.find((a) => a.id === id && isOpen(a, showDevelopment));
}

/** Whether an area has a page in this build. */
export function isOpen(area: Area, showDevelopment: boolean): boolean {
  return area.status === 'available' || (area.status === 'development' && showDevelopment);
}
