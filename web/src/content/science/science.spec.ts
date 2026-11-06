import { SCIENCE, SCIENCE_SOURCES, ScienceContent, scienceFor } from '..';
import { CONDITIONS, isCondition } from '../../app/flow/conditions';
import { EXERCISES } from '../../app/experiences/registry';

// Plan §3.1: the science explanation standard. Evidence is for the method, never for this
// exercise; only checked sources (✔F full text, ✔A abstract) are cited.

function texts(s: ScienceContent): string[] {
  return [
    ...(s.why ? [s.why] : []),
    s.what_you_do,
    s.method.name,
    s.method.text,
    ...s.research.map((r) => r.text),
    s.about_this_exercise,
    ...s.limits,
  ];
}

describe('science explanations', () => {
  it('exist for every experience, once each', () => {
    expect(CONDITIONS.map((c) => scienceFor(c.value)?.experience)).toEqual(CONDITIONS.map((c) => c.value));
    expect(EXERCISES.map((e) => scienceFor(e.value)?.experience)).toEqual(EXERCISES.map((e) => e.value));
    expect(new Set(SCIENCE.map((s) => s.id)).size).toBe(SCIENCE.length);
    for (const s of SCIENCE) expect(s.version).toMatch(/^\d+$/);
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
    const forbidden = /\b(stud(y|ying|ies)|phases?|sessions?|action bridge|state reset|restatement)\b/i;
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

describe('Science explanations of exercises outside the experiment (cognitive-shifts-design.md §7)', () => {
  const cs = SCIENCE.filter((s) => !isCondition(s.experience));
  const experiment = SCIENCE.filter((s) => isCondition(s.experience));

  it('exist for all of them', () => {
    expect(cs.map((s) => s.experience).sort()).toEqual([
      'cs_not_enough_to_go_on',
      'cs_other_readings',
      'cs_why_it_happened',
      'mcii',
    ]);
  });

  it('give every finding its evidence layer and who took part, in what setting', () => {
    for (const s of cs) {
      for (const r of s.research) {
        expect(r.layer, `${s.id}: ${r.text}`).toMatch(/^(method|similar)$/);
        expect(r.who?.trim(), `${s.id}: ${r.text}`).toBeTruthy();
      }
      expect(s.similar_note?.trim(), s.id).toBeTruthy();
    }
  });

  it("say why each exercise is worth doing, in everyday terms", () => {
    for (const s of cs) expect(s.why?.trim(), s.id).toBeTruthy();
  });

  it('follow the on-screen wording rules in the population lines and notes too', () => {
    const forbidden = /\b(stud(y|ying|ies)|phases?|sessions?)\b/i;
    for (const s of cs) {
      for (const text of [...s.research.map((r) => r.who ?? ''), s.similar_note ?? '']) {
        expect(text, `${s.id}: "${text}"`).not.toMatch(forbidden);
      }
    }
  });

  it('leave the four experiment explanations unchanged in form', () => {
    for (const s of experiment) {
      expect(s.research.some((r) => r.layer || r.who), s.id).toBe(false);
      expect(s.similar_note, s.id).toBeUndefined();
      expect(s.why, s.id).toBeUndefined();
    }
  });
});

describe('MCII science explanation (mcii-design.md §6)', () => {
  const mcii = scienceFor('mcii')!;

  it('names each evidence track on the method side, so no effect is borrowed from another', () => {
    const method = mcii.research.filter((r) => r.layer === 'method').map((r) => r.text);
    expect(method.some((t) => t.startsWith('Mental contrasting alone:'))).toBe(true);
    expect(method.some((t) => t.startsWith('If-then plans alone:'))).toBe(true);
    expect(method.some((t) => t.startsWith('The two together:'))).toBe(true);
    expect(method.some((t) => t.startsWith('The two together, compared with each part:'))).toBe(true);
  });

  it('says the picture is only an illustration, and cites no research for it', () => {
    expect(mcii.about_this_exercise).toMatch(/path picture is only an illustration/);
    for (const r of mcii.research) expect(r.text).not.toMatch(/\b(picture|path|wall|bridge)\b/i);
  });
});
