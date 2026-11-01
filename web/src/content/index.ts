// Versioned experience content. Each file carries its own id and version; sessions
// record exactly which versions were shown (plan §6.1). Superseded versions stay in
// this folder unchanged so stored sessions remain interpretable.
// v2 (action bridge, goal restatement, ratings): plain on-screen wording, parallel intros
// without efficacy claims (protocol v1.4).
import actionBridgeJson from './action-bridge.v2.json';
import goalRestatementJson from './goal-restatement.v2.json';
import ratingsJson from './ratings.v2.json';
// v3: the picture is chosen and described in its own step and quoted back; a labelled
// preview and a 15 s practice round, identical in both variants, come before the timed
// rounds. The 8 x 24 s dose is unchanged from v2 (Engelhard et al. 2011).
import stateResetJson from './state-reset.v3.json';
// Science explanations ("Why this exercise?", plan §3.1): versioned apart from the
// experience content, so the experiment's content versions don't change.
import scienceActionBridgeJson from './science/action-bridge.v1.json';
import scienceGameOnlyJson from './science/game-only.v1.json';
import scienceGoalRestatementJson from './science/goal-restatement.v1.json';
import scienceSourcesJson from './science/sources.v1.json';
import scienceStateResetJson from './science/state-reset.v1.json';

export interface Versioned {
  id: string;
  version: string;
}

export interface TextField {
  label: string;
  placeholder: string;
}

export interface RatingItem {
  intro?: string;
  label: string;
  min_label: string;
  max_label: string;
}

export interface RatingsContent extends Versioned {
  items: { unpleasant: RatingItem; image_vividness: RatingItem; image_emotionality: RatingItem };
}

export type CueType = 'time' | 'place' | 'after_event';

export interface ActionBridgeContent extends Versioned {
  title: string;
  intro: string;
  goal: TextField;
  cue_question: string;
  cue_types: { value: CueType; label: string; prefix: string; placeholder: string }[];
  first_step: TextField;
  obstacle: TextField;
  obstacle_response: TextField;
  rehearsal: { heading: string; instruction: string; confirm: string; change: string };
}

export interface GoalRestatementContent extends Versioned {
  title: string;
  intro: string;
  goal: TextField;
  topic: TextField;
  read_back: {
    heading: string;
    goal_prefix: string;
    topic_prefix: string;
    instruction: string;
    confirm: string;
    change: string;
  };
}

/** Texts that differ between the image and game-only variants; both have the same keys. */
export interface StateResetTexts {
  title: string;
  about_intro: string;
  about_parts: string[];
  about_duration: string;
  practice: string;
  hold: string;
  hold_countdown: string;
  round_heading: string;
  round: string;
  rest: string;
}

export interface StateResetTiming {
  practice_seconds: number;
  hold_seconds: number;
  sets: number;
  set_seconds: number;
  rest_seconds: number;
}

export interface StateResetContent extends Versioned {
  timing: StateResetTiming;
  game: { speed: number; reduced_motion_speed: number; ring_radius: number };
  how_it_works: {
    heading: string;
    illustration_alt: string;
    labels: { dot: string; ring: string; pointer: string };
    text: string;
    mouse: string;
    keyboard: string;
    start_practice: string;
    practice_heading: string;
    practice_done: string;
    practise_again: string;
    ready: string;
  };
  picture: {
    heading: string;
    invitation: string;
    examples: string[];
    experiment_note: string;
    safety: string;
    field_label: string;
    field_placeholder: string;
    field_hint: string;
    rating_heading: string;
    rating_before: string;
    rating_after: string;
  };
  image_variant: StateResetTexts;
  game_only_variant: StateResetTexts;
  next_label: string;
  continue_label: string;
  stop_label: string;
}

export const RATINGS: RatingsContent = ratingsJson;
export const ACTION_BRIDGE: ActionBridgeContent = actionBridgeJson as ActionBridgeContent;
export const GOAL_RESTATEMENT: GoalRestatementContent = goalRestatementJson;
export const STATE_RESET: StateResetContent = stateResetJson;

/** full_text = ✔F (full text checked), abstract = ✔A. Unverified (◐) sources are never cited. */
export type Evidence = 'full_text' | 'abstract';

export interface ScienceSource {
  citation: string;
  title: string;
  url: string;
  evidence: Evidence;
}

export interface ScienceContent extends Versioned {
  /** The experience (condition value) this explains. */
  experience: string;
  what_you_do: string;
  method: { name: string; text: string };
  /** Evidence for the method, never for this exercise; each finding names its sources. */
  research: { text: string; sources: string[] }[];
  /** Required: separates the method's evidence from this untested version. */
  about_this_exercise: string;
  limits: string[];
}

export interface ScienceSources extends Versioned {
  sources: Record<string, ScienceSource>;
}

export const SCIENCE_SOURCES = scienceSourcesJson as ScienceSources;
export const SCIENCE: ScienceContent[] = [
  scienceActionBridgeJson,
  scienceGoalRestatementJson,
  scienceStateResetJson,
  scienceGameOnlyJson,
];

export function scienceFor(experience: string | null | undefined): ScienceContent | undefined {
  return SCIENCE.find((s) => s.experience === experience);
}

/** Fills {name} placeholders in a content string. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
