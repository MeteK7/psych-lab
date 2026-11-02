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
}

export interface Area {
  id: string;
  title: string;
  text: string;
  status: 'available' | 'planned';
  intro?: string;
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
    ],
  },
  {
    id: 'cognitive-shifts',
    title: 'Cognitive shifts',
    text: 'Find other ways to see difficulties, mistakes, setbacks and unclear situations.',
    status: 'planned',
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
export function areaById(id: string | null): Area | undefined {
  return AREAS.find((a) => a.id === id && a.status === 'available');
}
