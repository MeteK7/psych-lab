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
// Sound version of the dot game (plan §8, level B): an accessible alternative offered in
// Try it only, never in experiment exercises. Recorded only when it was used.
import stateResetSoundJson from './state-reset-sound.v1.json';
// Science explanations ("Why this exercise?", plan §3.1): versioned apart from the
// experience content, so the experiment's content versions don't change.
import scienceActionBridgeJson from './science/action-bridge.v1.json';
import scienceGameOnlyJson from './science/game-only.v1.json';
import scienceGoalRestatementJson from './science/goal-restatement.v1.json';
import scienceSourcesJson from './science/sources.v1.json';
import scienceStateResetJson from './science/state-reset.v1.json';
// Cognitive shifts (docs/cognitive-shifts-design.md): Try it only, development only until the
// content review and full-text gates pass. Their science explanations add an evidence layer
// and a population line to every finding; their sources are kept apart from sources.v1.json,
// which the experiment exercises' explanations use and which doesn't change.
// cs-other-readings v2: step 1 asks to pick a reading above the cards, and to write your own
// above the field. v3 (all three): "write my own" is an option among the cards that opens the
// text field, as in CS3's situation step. cs-other-readings v4: Lens 2 sets up the friend's
// perspective above the question, instead of a fixed line below the options.
// cs-not-enough v3 (cs3-redesign-proposal.md, revision 2): readings by kind; step 3 checks which
// readings the facts could also fit (no points); one "Can you find out?" step; two questions to keep.
// v4: step 5 reassesses the same first reading, says no direction is expected, and shows both ratings.
import csNotEnoughJson from './cs-not-enough.v4.json';
import csOtherReadingsJson from './cs-other-readings.v4.json';
import csWhyItHappenedJson from './cs-why-it-happened.v2.json';
import scienceCsNotEnoughJson from './science/cs-not-enough.v1.json';
import scienceCsOtherReadingsJson from './science/cs-other-readings.v1.json';
import scienceCsWhyItHappenedJson from './science/cs-why-it-happened.v1.json';
import scienceSourcesCsJson from './science/sources-cs.v1.json';

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

export interface ToneSettings {
  low_hz: number;
  high_hz: number;
  tone_ms: number;
  /** Share of tones that are high (the ones to respond to). */
  high_share: number;
  min_gap_ms: number;
  max_gap_ms: number;
  response_window_ms: number;
}

export interface StateResetSoundContent extends Versioned {
  tones: ToneSettings;
  offer: { question: string; use_sound: string; use_dot: string; note: string };
  how_it_works: {
    heading: string;
    text: string;
    keyboard: string;
    pointer: string;
    sound_check: string;
    low: string;
    high: string;
    respond: string;
    game_label: string;
  };
  round: { image: string; game_only: string };
}

export const STATE_RESET_SOUND: StateResetSoundContent = stateResetSoundJson;

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
  /** Cognitive shifts: why it's worth doing, in everyday terms; shown after "What you do". */
  why?: string;
  what_you_do: string;
  method: { name: string; text: string };
  /** Evidence for the method, never for this exercise; each finding names its sources. */
  research: {
    text: string;
    sources: string[];
    /** Cognitive shifts only: research on the method, or on similar exercises. */
    layer?: 'method' | 'similar';
    /** Cognitive shifts only: who took part and in what setting. */
    who?: string;
  }[];
  /** Cognitive shifts only: shown under "Research on similar exercises" without a citation. */
  similar_note?: string;
  /** Required: separates the method's evidence from this untested version. */
  about_this_exercise: string;
  limits: string[];
}

export interface ScienceSources extends Versioned {
  sources: Record<string, ScienceSource>;
}

const SOURCES_V1 = scienceSourcesJson as ScienceSources;
export const SCIENCE_SOURCES: ScienceSources = {
  ...SOURCES_V1,
  sources: { ...SOURCES_V1.sources, ...(scienceSourcesCsJson as ScienceSources).sources },
};
export const SCIENCE: ScienceContent[] = [
  scienceActionBridgeJson,
  scienceGoalRestatementJson,
  scienceStateResetJson,
  scienceGameOnlyJson,
  scienceCsOtherReadingsJson as ScienceContent,
  scienceCsWhyItHappenedJson as ScienceContent,
  scienceCsNotEnoughJson as ScienceContent,
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

// ---------- Cognitive shifts ----------

export interface CsCard {
  id: string;
  text: string;
}

export interface CsOtherReadingsContent extends Versioned {
  safety: string;
  first: {
    intro: string;
    ask: string;
    cards: (CsCard & { kind: 'self' | 'situation' })[];
    own_choice: string;
    own_label: string;
  };
  feel: {
    reading: string;
    belief: RatingItem;
    upset: RatingItem;
    control: { question: string; options: { id: 'yes' | 'partly' | 'no'; label: string }[] };
  };
  lenses: {
    counter: string;
    own_choice: string;
    own_label: string;
    nothing: string;
    next_lens: string;
    /** lead: paragraphs that set up the lens, shown above its question. */
    items: { id: string; title: string; lead?: string[]; prompt: string; cards: CsCard[] }[];
  };
  sort: {
    intro: string;
    first_tag: string;
    place_label: string;
    columns: { id: 'fits' | 'partly' | 'not'; label: string }[];
    unplaced: string;
    none_fit: string;
  };
  close: {
    kept: string;
    none_kept: string;
    first_self: string;
    first_situation: string;
    control: string;
    plan_link: string;
  };
  next_label: string;
  finish_label: string;
}

export interface CsWhyItHappenedContent extends Versioned {
  safety: string;
  setback: { intro: string; label: string };
  first: { ask: string; cards: CsCard[]; own_choice: string; own_label: string };
  more: {
    intro: string;
    cards: CsCard[];
    own_choice: string;
    own_label: string;
    add: string;
    count: string;
    your_causes: string;
  };
  map: {
    counter: string;
    axes: { id: 'who' | 'time' | 'scope'; low: string; high: string }[];
    next_cause: string;
    chart_label: string;
    list_heading: string;
  };
  reflect: { changeable: string; about_you: string; heavy: string; effort: string; add_heading: string };
  change: { ask: string; none: string; plan_prompt: string; plan_link: string };
  next_label: string;
  finish_label: string;
}

/**
 * A CS3 reading. Its kind is for authors and reviewers (cs3-redesign-proposal.md §3): each set
 * covers the feared reading, a milder one, and readings that aren't about the person.
 */
export interface CsReading extends CsCard {
  kind: 'feared' | 'mild' | 'them' | 'circumstances' | 'positive';
}

export interface CsNotEnoughContent extends Versioned {
  safety: string;
  situation: {
    ask: string;
    own_choice: string;
    own_label: string;
    scenarios: { id: string; text: string; readings: CsReading[] }[];
    /** General readings for a situation the person describes themself. */
    own_readings: CsReading[];
  };
  first: { ask: string; own_choice: string; own_label: string; certainty: RatingItem };
  fit: {
    facts_label: string;
    your_reading: string;
    ask: string;
    hint: string;
    something_else: string;
    own_prompt: string;
    own_label: string;
    add: string;
    done: string;
    note_some: string;
    note_none: string;
    note_something: string;
    note_always: string;
  };
  find: { intro: string; decide: string; ask: string; options: { id: string; label: string; follow?: string }[] };
  after: {
    reading: string;
    checked: string;
    certainty: RatingItem;
    no_direction: string;
    compared: string;
    compared_means: string;
    keep_heading: string;
    keep: string[];
    plan_prompt: string;
    plan_link: string;
  };
  next_label: string;
  finish_label: string;
}

export const CS_OTHER_READINGS = csOtherReadingsJson as CsOtherReadingsContent;
export const CS_WHY_IT_HAPPENED = csWhyItHappenedJson as CsWhyItHappenedContent;
export const CS_NOT_ENOUGH = csNotEnoughJson as CsNotEnoughContent;
