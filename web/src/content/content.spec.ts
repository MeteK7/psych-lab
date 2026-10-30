import { ACTION_BRIDGE, GOAL_RESTATEMENT, RATINGS, STATE_RESET } from '.';

const ALL = [ACTION_BRIDGE, GOAL_RESTATEMENT, RATINGS, STATE_RESET];

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('experience content', () => {
  it('has a unique id and a version for every file', () => {
    const ids = ALL.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of ALL) expect(c.version).toMatch(/^\d+$/);
  });

  // Plan 5.1: the trace rule is a standing study rule and must not appear in any
  // experience, so that measurement is identical across conditions.
  it('never mentions the outcome trace', () => {
    const forbidden = /\b(commit|save|saving|workspace|git|file|folder|repo(sitory)?)\b/i;
    for (const c of ALL) {
      for (const text of strings(c)) expect(text, `${c.id}: "${text}"`).not.toMatch(forbidden);
    }
  });

  it('uses identical timing for the image and game-only variants', () => {
    // One shared timing block is what keeps the phase-2 control duration-matched.
    expect(STATE_RESET.timing.sets).toBeGreaterThan(0);
    expect(Object.keys(STATE_RESET.image_variant)).toEqual(Object.keys(STATE_RESET.game_only_variant));
  });
});
