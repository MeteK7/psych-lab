import { OutputEmitterRef } from '@angular/core';

/** What an experience reports when it finishes. */
export interface StepOutcome {
  /** Summary stored in the session's step record. */
  result: Record<string, unknown>;
  /** Merged into the session's plan (plan components only). */
  plan?: Record<string, unknown>;
  /** Merged into the session's ratings. */
  ratings?: Record<string, number>;
  /**
   * Suggested next exercise, offered on the done screen (not saved). Cognitive shifts uses
   * it to point to "Plan your first step" when a situation can be acted on.
   */
  next?: { label: string; exercise: 'action_bridge' };
}

/** The whole contract between the session flow and an experience (plan §6.1). */
export interface Experience {
  readonly completed: OutputEmitterRef<StepOutcome>;
}
