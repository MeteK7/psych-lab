import { CONDITIONS } from '../flow/conditions';
import { EXERCISES, exerciseInfo, isExerciseId, stepsFor } from './registry';

describe('exercise registry', () => {
  it('holds the four experiment exercises, in the experiment phases they belong to', () => {
    expect(CONDITIONS.map((c) => [c.value, c.experiment])).toEqual([
      ['action_bridge', 1],
      ['goal_restatement', 1],
      ['state_reset+action_bridge', 2],
      ['game_only+action_bridge', 2],
    ]);
  });

  it('gives every exercise a unique id, steps, one fixed duration and a method', () => {
    expect(new Set(EXERCISES.map((e) => e.value)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) {
      expect(e.steps.length, e.value).toBeGreaterThan(0);
      expect(Number.isInteger(e.minutes), e.value).toBe(true);
      expect(e.method.name, e.value).not.toBe('');
    }
  });

  it('recognises only registered exercises', () => {
    expect(isExerciseId('action_bridge')).toBe(true);
    expect(isExerciseId('something_else')).toBe(false);
    expect(exerciseInfo('something_else')).toBeUndefined();
  });

  it('returns a copy of the steps, so callers cannot change the definitions', () => {
    stepsFor('goal_restatement').push('post_rating');
    expect(stepsFor('goal_restatement')).toHaveLength(3);
  });
});
