import { SessionUpsert } from '../api/types';
import { PRACTICE_NOTE, STORAGE_TEXT, TRY_RESULT_KEYS, sinkFor } from './result-sink';

const record: SessionUpsert = {
  mode: 'try',
  condition: 'mcii',
  status: 'completed',
  content_versions: { mcii: '2' },
  steps: [
    {
      step: 'mcii_wish',
      started_at: 't0',
      ended_at: 't1',
      result: { category: 'learning', visual_source: 'scene:mcii.path@4' },
    },
    { step: 'stopped', started_at: 't1', ended_at: 't1', result: { during: 'mcii_outcome' } },
  ],
  plan: { goal: 'PRIVATE' },
  ratings: { pre: 4 },
  started_at: 't0',
  ended_at: 't1',
  n1_reveal_id: null,
};

describe('result sinks', () => {
  it('Try it keeps only that the exercise ran, and when', () => {
    const sink = sinkFor('try');
    expect(sink.keeps).toBe('run-only');
    const kept = sink.record(record);
    expect(kept.plan).toBeNull();
    expect(kept.ratings).toBeNull();
    expect(kept.steps?.map((s) => s.result)).toEqual([
      { visual_source: 'scene:mcii.path@4' },
      { during: 'mcii_outcome' },
    ]);
    // Everything else, the run's metadata, is kept as it was.
    const answersRemoved = { steps: [], plan: null, ratings: null };
    expect({ ...kept, ...answersRemoved }).toEqual({ ...record, ...answersRemoved });
    expect(kept.steps?.map((s) => [s.step, s.started_at, s.ended_at])).toEqual(
      record.steps?.map((s) => [s.step, s.started_at, s.ended_at]),
    );
    expect(JSON.stringify(kept)).not.toContain('PRIVATE');
  });

  it('keeps step metadata only from the agreed list (the API accepts the same)', () => {
    expect([...TRY_RESULT_KEYS]).toEqual(['during', 'task', 'visual_source']);
  });

  it.each(['self_use', 'dev', 'usability'] as const)('the research record (%s) is sent as it is', (mode) => {
    const sink = sinkFor(mode);
    expect(sink.keeps).toBe('everything');
    expect(sink.record({ ...record, mode })).toEqual({ ...record, mode });
  });

  it('what the screens say matches what each sink keeps', () => {
    const tryIt = STORAGE_TEXT[sinkFor('try').keeps];
    for (const line of Object.values(tryIt)) expect(line).not.toMatch(/answers are saved|so far is saved/);
    expect(tryIt.before).toContain('Nothing you write or choose is saved');
    expect(STORAGE_TEXT[sinkFor('self_use').keeps].before).toBe('Your answers are saved after each step.');
    expect(PRACTICE_NOTE).toContain('without anything you write or choose');
  });
});
