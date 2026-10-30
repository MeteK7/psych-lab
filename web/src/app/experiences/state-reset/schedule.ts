import { StateResetTiming } from '../../../content';

export type Variant = 'image' | 'game_only';

export type Phase =
  | { kind: 'intro' }
  | { kind: 'rating'; when: 'pre' | 'post' }
  | { kind: 'hold'; seconds: number }
  | { kind: 'play'; seconds: number; set: number }
  | { kind: 'rest'; seconds: number; afterSet: number };

/**
 * Phase sequence for one State Reset run. Both variants share identical timed phases,
 * so the game-only control matches the image condition in duration and game exposure;
 * only the image instructions and image ratings differ.
 */
export function buildSchedule(timing: StateResetTiming, variant: Variant): Phase[] {
  const phases: Phase[] = [{ kind: 'intro' }];
  if (variant === 'image') phases.push({ kind: 'rating', when: 'pre' });
  phases.push({ kind: 'hold', seconds: timing.hold_seconds });
  for (let set = 1; set <= timing.sets; set++) {
    phases.push({ kind: 'play', seconds: timing.set_seconds, set });
    if (set < timing.sets) phases.push({ kind: 'rest', seconds: timing.rest_seconds, afterSet: set });
  }
  if (variant === 'image') phases.push({ kind: 'rating', when: 'post' });
  return phases;
}

export function timedSeconds(phases: Phase[]): number {
  return phases.reduce((sum, p) => sum + ('seconds' in p ? p.seconds : 0), 0);
}
