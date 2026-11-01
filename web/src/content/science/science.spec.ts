import { SCIENCE, SCIENCE_SOURCES, ScienceContent, scienceFor } from '..';
import { CONDITIONS } from '../../app/flow/conditions';

// Plan §3.1: the science explanation standard. Evidence is for the method, never for this
// exercise; only checked sources (✔F full text, ✔A abstract) are cited.

function texts(s: ScienceContent): string[] {
  return [
    s.what_you_do,
    s.method.name,
    s.method.text,
    ...s.research.map((r) => r.text),
    s.about_this_exercise,
    ...s.limits,
  ];
}

/** Body words, without the method name, which is a heading. */
function words(s: ScienceContent): number {
  const body = texts(s).filter((t) => t !== s.method.name);
  return body.join(' ').split(/\s+/).filter(Boolean).length;
}

describe('science explanations', () => {
  it('exist for every experience, once each', () => {
    expect(CONDITIONS.map((c) => scienceFor(c.value)?.experience)).toEqual(CONDITIONS.map((c) => c.value));
    expect(new Set(SCIENCE.map((s) => s.id)).size).toBe(SCIENCE.length);
    for (const s of SCIENCE) expect(s.version).toMatch(/^\d+$/);
  });

  it('stay short: about 120–280 words each', () => {
    for (const s of SCIENCE) {
      expect(words(s), s.id).toBeGreaterThanOrEqual(100);
      expect(words(s), s.id).toBeLessThanOrEqual(280);
    }
  });

  it('cite only known, checked sources for every research finding', () => {
    for (const s of SCIENCE) {
      expect(s.research.length, s.id).toBeGreaterThan(0);
      for (const r of s.research) {
        expect(r.sources.length, `${s.id}: ${r.text}`).toBeGreaterThan(0);
        for (const key of r.sources) {
          const source = SCIENCE_SOURCES.sources[key];
          expect(source, `${s.id}: unknown source ${key}`).toBeDefined();
          expect(['full_text', 'abstract']).toContain(source.evidence);
          expect(source.url).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('match their wording to the evidence: "found" needs full text, abstracts only "suggest"', () => {
    for (const s of SCIENCE) {
      for (const r of s.research) {
        const fullText = r.sources.every((k) => SCIENCE_SOURCES.sources[k].evidence === 'full_text');
        if (/\bfound\b/i.test(r.text)) expect(fullText, `${s.id}: ${r.text}`).toBe(true);
        if (!fullText) expect(r.text, s.id).toMatch(/\bsuggest/i);
      }
    }
  });

  it('separate the method from this exercise, which has not been tested itself', () => {
    for (const s of SCIENCE) {
      expect(s.about_this_exercise, s.id).toMatch(/hasn't been tested itself/);
    }
  });

  it('never imply that research validated this exercise', () => {
    const claim =
      /\b(proven|proves|clinically|guarantee[sd]?|validated|scientifically shown|it works|works for you|will help|this exercise (helps|works|reduces|improves))\b/i;
    for (const s of SCIENCE) {
      for (const text of texts(s)) expect(text, `${s.id}: "${text}"`).not.toMatch(claim);
    }
  });

  it('follow the on-screen wording rules', () => {
    // As for experience content: no "study", "phase", "session" or internal names.
    const forbidden = /\b(stud(y|ying|ies)|phase|session|action bridge|state reset|restatement)\b/i;
    for (const s of SCIENCE) {
      for (const text of texts(s)) expect(text, `${s.id}: "${text}"`).not.toMatch(forbidden);
    }
  });

  it('say which exercises are experimental or comparison versions', () => {
    const say = (value: string) => scienceFor(value)!;
    expect(say('state_reset+action_bridge').about_this_exercise).toMatch(/experimental/);
    expect(say('goal_restatement').method.name).toMatch(/comparison/);
    expect(say('game_only+action_bridge').method.name).toMatch(/comparison/);
  });
});
