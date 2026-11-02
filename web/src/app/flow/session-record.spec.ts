import { addStep, addStop, contentVersionsFor, newDraft, toUpsert } from './session-record';

const T0 = '2026-10-30T18:00:00.000Z';
const T1 = '2026-10-30T18:01:00.000Z';
const T2 = '2026-10-30T18:04:00.000Z';

describe('session record', () => {
  it('records every content version a condition can show', () => {
    expect(contentVersionsFor('state_reset+action_bridge')).toEqual({
      ratings: '2',
      'state-reset': '3',
      'action-bridge': '2',
    });
    expect(contentVersionsFor('goal_restatement')).toEqual({ ratings: '2', 'goal-restatement': '2' });
  });

  it('adds step summaries with their content version and merges plan and ratings', () => {
    let draft = newDraft('id-1', 'self_use', 'action_bridge', T0);
    draft = addStep(draft, 'pre_rating', T0, T1, {
      result: { unpleasant: 6 },
      ratings: { unpleasant_pre: 6 },
    });
    draft = addStep(draft, 'action_bridge', T1, T2, {
      result: { rehearsed: true },
      plan: { type: 'action_bridge', cue: '19:00' },
    });

    expect(draft.steps.map((s) => [s.step, s.content_id, s.content_version])).toEqual([
      ['pre_rating', 'ratings', '2'],
      ['action_bridge', 'action-bridge', '2'],
    ]);
    expect(draft.ratings).toEqual({ unpleasant_pre: 6 });
    expect(draft.plan).toEqual({ type: 'action_bridge', cue: '19:00' });
  });

  it('builds the API body for a finished session', () => {
    const draft = addStep(newDraft('id-1', 'dev', 'goal_restatement', T0), 'pre_rating', T0, T1, {
      result: {},
      ratings: { unpleasant_pre: 2 },
    });
    expect(toUpsert(draft, 'completed', T2)).toMatchObject({
      mode: 'dev',
      condition: 'goal_restatement',
      status: 'completed',
      started_at: T0,
      ended_at: T2,
      ratings: { unpleasant_pre: 2 },
      plan: null,
    });
  });

  it('adds the sound game content version only when the sound version was used', () => {
    const base = newDraft('id', 'try', 'game_only+action_bridge', T0);
    const dot = addStep(base, 'game_only', T0, T1, { result: { task: 'dot' } });
    const sound = addStep(base, 'game_only', T0, T1, { result: { task: 'sound' } });
    expect(toUpsert(dot, 'in_progress', null).content_versions).not.toHaveProperty('state-reset-sound');
    expect(toUpsert(sound, 'in_progress', null).content_versions).toEqual({
      ratings: '2',
      'state-reset': '3',
      'action-bridge': '2',
      'state-reset-sound': '1',
    });
  });

  it('sends null ratings when none were given', () => {
    expect(toUpsert(newDraft('id', 'dev', 'action_bridge', T0), 'in_progress', null).ratings).toBeNull();
  });

  it('records where a session was stopped', () => {
    const draft = addStop(newDraft('id', 'dev', 'game_only+action_bridge', T0), 'game_only', T1);
    expect(draft.steps.at(-1)).toEqual({
      step: 'stopped',
      started_at: T1,
      ended_at: T1,
      result: { during: 'game_only' },
    });
  });
});
