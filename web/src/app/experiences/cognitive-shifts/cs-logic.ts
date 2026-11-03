// Rules for the Cognitive shifts exercises (docs/cognitive-shifts-design.md), kept pure so
// they can be tested apart from the screens.

export type Column = 'fits' | 'partly' | 'not';

/**
 * CS1 close. A first reading placed in "Fits" gets a close that matches its kind:
 * self-judgements (and own readings, which can't be told apart) are acknowledged without
 * being endorsed; readings of the situation may simply be right.
 */
export function firstReadingClose(
  kind: 'self' | 'situation' | 'own',
  column: Column | null,
): 'first_self' | 'first_situation' | null {
  if (column !== 'fits') return null;
  return kind === 'situation' ? 'first_situation' : 'first_self';
}

/** CS2: one cause on the three five-point scales (1 = left label, 5 = right label). */
export interface CausePosition {
  /** 1 = about me … 5 = about the situation */
  who: number;
  /** 1 = lasting … 5 = just this time */
  time: number;
  /** 1 = affects everything … 5 = just this kind of task */
  scope: number;
}

export type Reflection = 'changeable' | 'about_you' | 'heavy' | 'effort';

/** CS2 step 5: which statements the map shows. Chosen by rules, never by judgement. */
export function reflections(causes: CausePosition[]): Reflection[] {
  const shown: Reflection[] = [];
  if (causes.some((c) => c.time >= 4 || c.who >= 4)) shown.push('changeable');
  if (causes.some((c) => c.who <= 2 && c.time <= 2)) shown.push('about_you');
  if (causes.length > 0 && causes.every((c) => c.who <= 2 && c.time <= 2 && c.scope <= 2)) {
    shown.push('heavy');
  }
  shown.push('effort');
  return shown;
}

/** CS2 step 6: causes that are about this time or the situation come first. */
export function changeOrder<T extends CausePosition>(causes: T[]): T[] {
  const changeable = (c: CausePosition) => c.time >= 4 || c.who >= 4;
  return [...causes.filter(changeable), ...causes.filter((c) => !changeable(c))];
}

/**
 * CS3 step 3 note. It reports only the person's own judgements and what follows from them: how
 * many readings, theirs included, the facts could fit. It never says they changed their mind.
 */
export function fitNote(othersTicked: number): { key: 'note_some' | 'note_none'; n: number } {
  return othersTicked > 0 ? { key: 'note_some', n: othersTicked + 1 } : { key: 'note_none', n: 1 };
}

/** CS3: a plan link is offered only for something the person can do: asking or checking. */
export function offersPlan(choice: string | null): boolean {
  return choice === 'ask' || choice === 'check';
}
