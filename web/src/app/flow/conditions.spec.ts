import { CONDITIONS, MODES, isCondition, isLevelAMode, stepsFor } from './conditions';

describe('conditions', () => {
  it('runs the plan factor alone in phase 1', () => {
    expect(stepsFor('action_bridge')).toEqual(['pre_rating', 'action_bridge', 'post_rating']);
    expect(stepsFor('goal_restatement')).toEqual(['pre_rating', 'goal_restatement', 'post_rating']);
  });

  it('holds Action Bridge constant after either pre-task in phase 2', () => {
    expect(stepsFor('state_reset+action_bridge')).toEqual([
      'pre_rating', 'state_reset', 'action_bridge', 'post_rating',
    ]);
    expect(stepsFor('game_only+action_bridge')).toEqual([
      'pre_rating', 'game_only', 'action_bridge', 'post_rating',
    ]);
  });

  it('returns a copy, so callers cannot change the definitions', () => {
    stepsFor('action_bridge').push('post_rating');
    expect(stepsFor('action_bridge')).toHaveLength(3);
  });

  it('lists every condition once and validates input', () => {
    expect(CONDITIONS.map((c) => c.value).every(isCondition)).toBe(true);
    expect(isCondition('something_else')).toBe(false);
  });

  it('offers only level-A modes', () => {
    expect(MODES.map((m) => m.value)).toEqual(['self_use', 'dev']);
    expect(isLevelAMode('usability')).toBe(false);
  });
});
