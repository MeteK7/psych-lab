import {
  ACTION_BRIDGE,
  CS_NOT_ENOUGH,
  CS_OTHER_READINGS,
  CS_WHY_IT_HAPPENED,
  GOAL_RESTATEMENT,
  RATINGS,
  STATE_RESET,
  STATE_RESET_SOUND,
  Versioned,
} from '../../content';
import { ExerciseId, Mode, SessionUpsert, Status, StepSummary } from '../api/types';
import { stepsFor } from '../experiences/registry';
import { StepId } from './conditions';
import { StepOutcome } from './step-outcome';

const CONTENT: Record<StepId, Versioned> = {
  pre_rating: RATINGS,
  post_rating: RATINGS,
  state_reset: STATE_RESET,
  game_only: STATE_RESET,
  action_bridge: ACTION_BRIDGE,
  goal_restatement: GOAL_RESTATEMENT,
  cs1_first: CS_OTHER_READINGS,
  cs1_feel_before: CS_OTHER_READINGS,
  cs1_lenses: CS_OTHER_READINGS,
  cs1_sort: CS_OTHER_READINGS,
  cs1_feel_after: CS_OTHER_READINGS,
  cs1_close: CS_OTHER_READINGS,
  cs2_setback: CS_WHY_IT_HAPPENED,
  cs2_first: CS_WHY_IT_HAPPENED,
  cs2_more: CS_WHY_IT_HAPPENED,
  cs2_map: CS_WHY_IT_HAPPENED,
  cs2_reflect: CS_WHY_IT_HAPPENED,
  cs2_change: CS_WHY_IT_HAPPENED,
  cs3_situation: CS_NOT_ENOUGH,
  cs3_first: CS_NOT_ENOUGH,
  cs3_share: CS_NOT_ENOUGH,
  cs3_find: CS_NOT_ENOUGH,
  cs3_after: CS_NOT_ENOUGH,
};

export interface SessionDraft {
  id: string;
  mode: Mode;
  condition: ExerciseId;
  startedAt: string;
  steps: StepSummary[];
  plan: Record<string, unknown> | null;
  ratings: Record<string, number>;
  /** n-of-1 sessions: the reveal that assigned the condition. */
  n1RevealId: string | null;
}

export function contentFor(step: StepId): Versioned {
  return CONTENT[step];
}

/** Every content file and version the exercise can show, recorded up front. */
export function contentVersionsFor(condition: ExerciseId): Record<string, string> {
  return Object.fromEntries(stepsFor(condition).map((s) => [CONTENT[s].id, CONTENT[s].version]));
}

export function newDraft(
  id: string,
  mode: Mode,
  condition: ExerciseId,
  startedAt: string,
  n1RevealId: string | null = null,
): SessionDraft {
  return { id, mode, condition, startedAt, steps: [], plan: null, ratings: {}, n1RevealId };
}

export function addStep(
  draft: SessionDraft,
  step: StepId,
  startedAt: string,
  endedAt: string,
  outcome: StepOutcome,
): SessionDraft {
  const content = CONTENT[step];
  return {
    ...draft,
    steps: [
      ...draft.steps,
      {
        step,
        content_id: content.id,
        content_version: content.version,
        started_at: startedAt,
        ended_at: endedAt,
        result: outcome.result,
      },
    ],
    plan: outcome.plan ? { ...(draft.plan ?? {}), ...outcome.plan } : draft.plan,
    ratings: { ...draft.ratings, ...(outcome.ratings ?? {}) },
  };
}

/** Records where a stopped session ended; the stop itself is not tied to any content. */
export function addStop(draft: SessionDraft, during: StepId, at: string): SessionDraft {
  return {
    ...draft,
    steps: [...draft.steps, { step: 'stopped', started_at: at, ended_at: at, result: { during } }],
  };
}

/** The condition's content, plus the sound version of the game if this session used it. */
function shownVersions(draft: SessionDraft): Record<string, string> {
  const versions = contentVersionsFor(draft.condition);
  if (draft.steps.some((s) => s.result?.['task'] === 'sound')) {
    versions[STATE_RESET_SOUND.id] = STATE_RESET_SOUND.version;
  }
  return versions;
}

export function toUpsert(draft: SessionDraft, status: Status, endedAt: string | null): SessionUpsert {
  return {
    mode: draft.mode,
    condition: draft.condition,
    status,
    content_versions: shownVersions(draft),
    steps: draft.steps,
    plan: draft.plan,
    ratings: Object.keys(draft.ratings).length ? draft.ratings : null,
    started_at: draft.startedAt,
    ended_at: endedAt,
    n1_reveal_id: draft.n1RevealId,
  };
}
