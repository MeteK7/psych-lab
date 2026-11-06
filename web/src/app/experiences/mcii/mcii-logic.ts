import { StepOutcome } from '../../flow/step-outcome';

/**
 * The rules of the MCII exercise (docs/mcii-design.md), with no screens and no visuals. Whatever
 * leaves here for the saved record is ids and ratings only, never what the person wrote.
 */

export const MCII_STAGES = [
  'mcii_wish',
  'mcii_outcome',
  'mcii_obstacle',
  'mcii_decide',
  'mcii_plan',
  'mcii_close',
] as const;

export type MciiStage = (typeof MCII_STAGES)[number];

export function isMciiStage(step: string | undefined): step is MciiStage {
  return (MCII_STAGES as readonly string[]).includes(step ?? '');
}

export type WishChoice = 'keep' | 'change' | 'set_aside';
export type Feeling = 'encouraged' | 'same' | 'discouraged';

/** The obstacle choices that aren't cards. */
export const OWN = 'own';
export const OUTSIDE = 'outside';

export interface Obstacle {
  /** A card id, "own" or "outside". The id is what gets saved. */
  id: string;
  /** Shown back during the exercise only; never part of any saved record. */
  text: string;
  /** The same obstacle worded to follow "If". */
  ifText: string;
}

// ---------- Step 1: the wish ----------

export interface WishAnswers {
  wish: string;
  category: string | null;
  matter: number | null;
  likely: number | null;
}

export function canLeaveWish({ wish, category, matter, likely }: WishAnswers): boolean {
  return wish.trim() !== '' && category !== null && matter !== null && likely !== null;
}

/** Also records which visual source was used, so visuals could be compared later. */
export function wishOutcome({ category, matter, likely }: WishAnswers, visualSource: string): StepOutcome {
  return {
    result: { category, visual_source: visualSource },
    ratings: { mcii_matter_pre: matter as number, mcii_likely_pre: likely as number },
  };
}

// ---------- Step 3: what's in the way ----------

/** A card's own wording, or what the person wrote for "My own" or "mostly outside me". */
export function obstacleFrom(
  choice: string | null,
  cards: readonly { id: string; text: string; if_text: string }[],
  ownText: string,
  outsideText: string,
): Obstacle | null {
  if (choice === null) return null;
  if (choice === OWN || choice === OUTSIDE) {
    const text = (choice === OWN ? ownText : outsideText).trim();
    return text ? { id: choice, text, ifText: text } : null;
  }
  const card = cards.find((c) => c.id === choice);
  return card ? { id: card.id, text: card.text, ifText: card.if_text } : null;
}

export function obstacleOutcome(obstacle: Obstacle): StepOutcome {
  return { result: { obstacle: obstacle.id } };
}

// ---------- Step 4: look at both ----------

export interface DecideAnswers {
  likely: number | null;
  choice: WishChoice | null;
  /** The wish as rewritten under "Change it"; never saved. */
  newWish: string;
}

/** The person has to rate and choose; "Change it" also needs the new wish. No choice is preferred. */
export function canLeaveDecide({ likely, choice, newWish }: DecideAnswers): boolean {
  if (likely === null || choice === null) return false;
  return choice !== 'change' || newWish.trim() !== '';
}

/** What the decision step reports. The rating never influences the choice, or the other way round. */
export function decideOutcome({ likely, choice }: DecideAnswers): StepOutcome {
  return { result: { choice }, ratings: { mcii_likely_post: likely as number } };
}

/** The wish carried forward: rewritten under "Change it", otherwise unchanged. */
export function wishAfterDecide(wish: string, { choice, newWish }: DecideAnswers): string {
  return choice === 'change' ? newWish.trim() : wish;
}

// ---------- Step 5: the plan ----------

/** Removes the words the sentence supplies itself, and any closing punctuation. */
function clause(text: string, lead: RegExp): string {
  return text.trim().replace(lead, '').replace(/[\s.,;:!?]+$/, '');
}

const IF_WORDS = /^if(\s+|$)/i;
const THEN_WORDS = /^(then(\s+|$))?(i\s+will(\s+|$))?/i;

/** "If …, then I will ….", from whatever the two parts were written as. */
export function planSentence(ifText: string, thenText: string): string {
  return `If ${clause(ifText, IF_WORDS)}, then I will ${clause(thenText, THEN_WORDS)}.`;
}

export function canLeavePlan(ifText: string, thenText: string | undefined): boolean {
  return clause(ifText, IF_WORDS) !== '' && clause(thenText ?? '', THEN_WORDS) !== '';
}

/** A card id or "own", or null when the wish was set aside. */
export function planOutcome(thenId: string | null): StepOutcome {
  return { result: { then: thenId } };
}

// ---------- Step 6: keeping it ----------

/** A plan also needs a readiness rating; a wish set aside doesn't. */
export function canLeaveClose(hasPlan: boolean, ready: number | null, feeling: Feeling | null): boolean {
  return feeling !== null && (!hasPlan || ready !== null);
}

export function closeOutcome(hasPlan: boolean, ready: number | null, feeling: Feeling | null): StepOutcome {
  return {
    result: { feeling },
    ...(hasPlan ? { ratings: { mcii_ready_post: ready as number } } : {}),
  };
}
