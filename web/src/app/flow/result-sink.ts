import { InjectionToken } from '@angular/core';

import { Mode, SessionUpsert } from '../api/types';

/**
 * Where a finished (or partial) exercise record goes (docs/product-model.md §6: "the experience
 * runtime never reads identity. It emits a finished result, and a sink chosen outside it decides
 * where the result goes"). Exercises don't know which sink they run under; the session page
 * chooses it from the mode.
 *
 * - `everything`: the research record (the experiment, Test mode, usability sessions), as the
 *   protocol fixes it.
 * - `run-only`: Try it. Only that the exercise ran, and when, is kept: no typed text, no choices,
 *   no ratings (decision 2026-11-09). The row is still needed, because the n-of-1 exposure
 *   analysis reads Try it runs on session days (api/app/n1.py, other_sessions).
 */
export type Keeps = 'everything' | 'run-only';

export interface ResultSink {
  readonly keeps: Keeps;
  /** The record as it may leave the browser. */
  record(upsert: SessionUpsert): SessionUpsert;
}

/**
 * Step metadata a Try it record keeps. None of it is an answer:
 * - `during`: the step a stopped run ended in
 * - `task`: which version of the dot game ran (picture or sound)
 * - `visual_source`: which picture was drawn (docs/visual-system.md §9)
 * The API accepts nothing else in Try it (TRY_RESULT_KEYS in api/app/schemas.py).
 */
export const TRY_RESULT_KEYS = ['during', 'task', 'visual_source'] as const;

const RESEARCH: ResultSink = { keeps: 'everything', record: (upsert) => upsert };

const TRY_IT: ResultSink = {
  keeps: 'run-only',
  record: (upsert) => ({
    ...upsert,
    steps: (upsert.steps ?? []).map((step) => ({
      ...step,
      result: Object.fromEntries(
        Object.entries(step.result ?? {}).filter(([key]) => (TRY_RESULT_KEYS as readonly string[]).includes(key)),
      ),
    })),
    plan: null,
    ratings: null,
  }),
};

export function sinkFor(mode: Mode): ResultSink {
  return mode === 'try' ? TRY_IT : RESEARCH;
}

/** The research sink, which sends the record as the exercise made it. */
export const KEEP_EVERYTHING: ResultSink = RESEARCH;

/**
 * How the session page chooses a sink: by mode. Provided, so the choice stays outside the
 * exercises (a later model can choose differently), and so exercise tests can see the record an
 * exercise makes before a sink narrows it.
 */
export const CHOOSE_SINK = new InjectionToken<(mode: Mode) => ResultSink>('CHOOSE_SINK', {
  providedIn: 'root',
  factory: () => sinkFor,
});

/** What each screen says about storage. It comes from the sink, so it can't drift from what is sent. */
export interface StorageText {
  /** Before Begin, after "About n minutes." */
  before: string;
  /** The done screen, after a completed run; `{time}` is the end time. */
  completed: string;
  /** The done screen, after a stopped run. */
  stopped: string;
  /** The confirmation before stopping. */
  confirmStop: string;
  /** When saving failed, on the done screen. */
  failed: string;
  /** When saving failed during a step; the next step saves again. */
  failedDuring: string;
}

export const STORAGE_TEXT: Record<Keeps, StorageText> = {
  everything: {
    before: 'Your answers are saved after each step.',
    completed: 'Saved at {time}.',
    stopped: 'What you did so far is saved.',
    confirmStop: 'Stop this exercise? What you did so far will be saved.',
    failed: "Your answers couldn't be saved. Is the local server running?",
    failedDuring:
      "Your answers couldn't be saved. Is the local server running? You can continue; they'll be saved again after the next step.",
  },
  'run-only': {
    before: 'Nothing you write or choose is saved. Only that you did this exercise, and when, is kept on this computer.',
    completed: 'Finished at {time}. Only that you did this exercise, and when, is kept.',
    stopped: 'Only that you started this exercise, and when, is kept.',
    confirmStop: "Stop this exercise? Nothing you wrote or chose is kept.",
    failed: "This visit couldn't be recorded. Is the local server running?",
    failedDuring:
      "This visit couldn't be recorded. Is the local server running? You can continue; it'll be recorded again after the next step.",
  },
};

/** The note on area pages: practice runs Try it, so it describes the Try it sink. */
export const PRACTICE_NOTE =
  "Practice exercises are listed in My records, without anything you write or choose. They're never part of your experiment.";

/** The same note in a booth, which lists no records. */
export const BOOTH_NOTE = "Nothing you write or choose is saved here.";
