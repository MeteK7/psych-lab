import { ACTION_BRIDGE, GOAL_RESTATEMENT, RATINGS, STATE_RESET, STATE_RESET_SOUND } from '.';

const ALL = [ACTION_BRIDGE, GOAL_RESTATEMENT, RATINGS, STATE_RESET, STATE_RESET_SOUND];

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

describe('on-screen wording', () => {
  // "Study" was ambiguous (learning vs. the research study); "phase" and condition codes
  // mean nothing to a user. Internal names live in code and docs only.
  it('never uses "study", "phase", "session" or internal experience names', () => {
    const forbidden = /\b(stud(y|ying|ies)|phases?|sessions?|action bridge|state reset|restatement)\b/i;
    for (const c of ALL) {
      // ids, versions and option values are internal, never shown.
      const { id: _id, version: _version, ...shown } = c;
      const texts = strings(shown).filter((t) => !/^[a-z_]+$/.test(t));
      for (const text of texts) expect(text, `${c.id}: "${text}"`).not.toMatch(forbidden);
    }
  });

  it('gives both dot variants the same practice round and the same keys', () => {
    expect(STATE_RESET.timing.practice_seconds).toBeGreaterThan(0);
    expect(STATE_RESET.image_variant.practice).toContain(`${STATE_RESET.timing.practice_seconds} seconds`);
    expect(STATE_RESET.game_only_variant.practice).toContain(`${STATE_RESET.timing.practice_seconds} seconds`);
  });

  it('keeps the two phase-1 intros parallel, without efficacy claims', () => {
    const claim = /\b(helps?|easier|better|it works|effective|proven)\b/i;
    expect(ACTION_BRIDGE.intro).not.toMatch(claim);
    expect(GOAL_RESTATEMENT.intro).not.toMatch(claim);
    expect(ACTION_BRIDGE.intro).toMatch(/Then you'll read it twice\.$/);
    expect(GOAL_RESTATEMENT.intro).toMatch(/Then you'll read them twice\.$/);
  });
});
