// Versioned experience content. Each file carries its own id and version; sessions
// record exactly which versions were shown (plan §6.1). Superseded versions stay in
// this folder unchanged so stored sessions remain interpretable.
import actionBridgeJson from './action-bridge.v1.json';
import goalRestatementJson from './goal-restatement.v1.json';
import ratingsJson from './ratings.v1.json';
// v2: 8 x 24 s sets, matching the verified protocol (Engelhard et al. 2011); v1 had 5 sets.
import stateResetJson from './state-reset.v2.json';

export interface Versioned {
  id: string;
  version: string;
}

export interface TextField {
  label: string;
  placeholder: string;
}

export interface RatingItem {
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
  cue_types: { value: CueType; label: string; prefix: string; placeholder: string }[];
  first_step: TextField;
  obstacle: TextField;
  obstacle_response: TextField;
  rehearsal: { instruction: string; confirm: string };
}

export interface GoalRestatementContent extends Versioned {
  title: string;
  intro: string;
  goal: TextField;
  topic: TextField;
  read_back: { instruction: string; confirm: string };
}

export interface StateResetTexts {
  intro: string;
  hold: string;
  during_play: string;
  rest: string;
}

export interface StateResetTiming {
  hold_seconds: number;
  sets: number;
  set_seconds: number;
  rest_seconds: number;
}

export interface StateResetContent extends Versioned {
  title: string;
  timing: StateResetTiming;
  game: { instructions: string; speed: number; reduced_motion_speed: number; ring_radius: number };
  image_variant: StateResetTexts;
  game_only_variant: StateResetTexts;
  stop_label: string;
}

export const RATINGS: RatingsContent = ratingsJson;
export const ACTION_BRIDGE: ActionBridgeContent = actionBridgeJson as ActionBridgeContent;
export const GOAL_RESTATEMENT: GoalRestatementContent = goalRestatementJson;
export const STATE_RESET: StateResetContent = stateResetJson;
