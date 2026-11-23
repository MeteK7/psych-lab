// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CASES } from '../study/cases';
import { UNSEEN } from '../study/unseen';
import { agreement, kappa } from './agreement';
import { measures } from './measures';
import { GROUP_LABELS, Group, PASS_A_LABEL, THRESHOLD, sliceResults } from './results';
import { AlignedRow, Row, parseAlignment, parsePassAAlignment, parseSheet, passAAccount, sectionProblems, sectionsOf, tablesIn } from './sheets';

/**
 * STUDY CODE, Stage 1b, slice 1 (docs/interpretation-trial/). The measures on hand-made fixtures with
 * known answers; the slice's files checked as they stand; and, once every sheet is filled, the results
 * written to results/slice-1.json. Nothing is sent anywhere.
 */
const TRIAL = '../docs/interpretation-trial/';
const SLICE = `${TRIAL}slice-1/`;
const SHEETS = ['annotator-a.md', 'annotator-b.md', 'reference.md', 'alignment-a-b.md', 'alignment-pass-a.md'];
const read = (path: string) => readFileSync(path, 'utf-8') as string;
const row = (id: string, cat: string, extra: Partial<Row> = {}): Row => ({ id, statement: `statement ${id}`, cat, basis: '', ...extra });
const aligned = (id: string, cat: string, reference: string, verdict: string): AlignedRow => ({ id, statement: `statement ${id}`, cat, reference, verdict });

describe('Stage 1b: agreement', () => {
  it('computes a known κ', () => {
    // Observed 3/4; expected 0.5 × 0.75 + 0.5 × 0.25 = 0.5; κ = 0.25 / 0.5.
    expect(kappa([['R', 'R'], ['R', 'R'], ['I', 'I'], ['I', 'R']] as const, ['R', 'I'])).toBeCloseTo(0.5, 10);
  });

  it('gives perfect agreement as κ 1 and full splitting agreement', () => {
    const a = [row('R1', 'R'), row('L1', 'L'), row('I1', 'I'), row('U1', 'U')];
    const g = agreement([{ id: 'T01', a, b: a, aligned: a.map((r) => [r.id, r.id] as const) }]);
    expect(g.splitting).toEqual({ anchored: 1, openEnded: 1 });
    expect(g.unaligned).toEqual([]);
    expect(g.raw).toBe(1);
    expect(g.kappa).toBe(1);
    expect(g.kappaEstablished).toBe(1);
  });

  it('counts an unpaired inference against splitting only when the other finds it unsupported, and reads the implied/inferred boundary on its own', () => {
    const a = [row('R1', 'R'), row('L1', 'L'), row('I1', 'I'), row('I2', 'I')];
    const b = [row('R1', 'R'), row('I1', 'I'), row('I2', 'I'), row('U1', 'U')];
    const g = agreement([{ id: 'T01', a, b, aligned: [['R1', 'R1'], ['L1', 'I1'], ['I1', 'I2'], ['I2', '—', 'plausible'], ['—', 'U1', 'unsupported']] }]);
    expect(g.pairs).toBe(3);
    // Anchored: A's R1 and L1, B's R1, all paired. Open-ended: four of five paired or plausible; B's U1 is not.
    expect(g.splitting.anchored).toBe(1);
    expect(g.splitting.openEnded).toBeCloseTo(4 / 5, 10);
    expect(g.unpairedOpenEnded).toEqual({ plausible: ['T01 A I2'], unsupported: ['T01 B U1'] });
    expect(g.confusion.L.I).toBe(1);
    expect(g.kappaImpliedInferred).toBe(0);
    expect(g.unknownIds).toEqual([]);
    expect(g.unaligned).toEqual([]);
  });

  it('counts an unpaired anchored statement against splitting, and names an unfinished alignment', () => {
    const a = [row('R1', 'R'), row('R2', 'R'), row('I1', 'I'), row('U1', 'U')];
    const b = [row('R1', 'R')];
    const g = agreement([{ id: 'T01', a, b, aligned: [['R1', 'R1'], ['R2', '—'], ['I1', '—']] }]);
    expect(g.splitting).toEqual({ anchored: 2 / 3, openEnded: 0 });
    expect(g.unaligned).toEqual(['T01 A I1: no view', 'T01 A U1: not in the alignment']);
  });
});

describe('Stage 1b: a candidate against the reference', () => {
  const reference = [row('R1', 'R'), row('L1', 'L'), row('I1', 'I', { wouldLicense: 'agreed' }), row('I2', 'I'), row('P', 'P'), row('U1', 'U'), row('U2', 'U')];

  it('counts an over-commitment, a possibility put as fact, a fabrication and a missed unknown', () => {
    const candidate = [
      aligned('R1', 'R', 'R1', 'match'),
      aligned('L1', 'R', 'L1', 'match'), // swapped: nothing drawn changes
      aligned('L2', 'L', 'I2', 'match'), // over-committed
      aligned('R2', 'R', 'P', 'match'), // over-committed, a possibility as fact
      aligned('L3', 'L', '', 'unlisted inference'), // over-committed
      aligned('R3', 'R', '', 'no basis'), // fabricated
      aligned('U1', 'U', 'U1', 'match'),
      aligned('P', 'P', '', 'outside the text'), // not scored
    ];
    const m = measures([{ id: 'T01', candidate, reference }]);
    expect(m.scored).toBe(7);
    expect(m.overCommitted).toEqual(['T01 L2', 'T01 R2', 'T01 L3']);
    expect(m.overCommitment).toBeCloseTo(3 / 7, 10);
    expect(m.possibleAsFact).toEqual(['T01 R2']);
    expect(m.swapped).toEqual(['T01 L1']);
    expect(m.fabricated).toEqual(['T01 R3']);
    expect(m.fabrication).toBeCloseTo(1 / 7, 10);
    expect(m.recall).toEqual({ R: { found: 1, of: 1 }, L: { found: 1, of: 1 }, P: { found: 1, of: 1 } });
    // Open-ended: coverage, not recall.
    expect(m.coverage).toEqual({ I: { found: 1, of: 2 }, U: { found: 1, of: 2 } });
    expect(m.problems).toEqual([]);
  });

  it('with the agreed licences, an inference both annotators would license counts as implied', () => {
    const candidate = [aligned('L1', 'L', 'I1', 'match')];
    expect(measures([{ id: 'T01', candidate, reference }]).overCommitted).toEqual(['T01 L1']);
    expect(measures([{ id: 'T01', candidate, reference }], { withAgreedLicences: true }).overCommitted).toEqual([]);
  });

  it('names an alignment to a statement the reference lacks, and an unknown verdict', () => {
    const m = measures([{ id: 'T01', candidate: [aligned('R1', 'R', 'R9', 'match'), aligned('R2', 'R', '', 'maybe')], reference }]);
    expect(m.problems).toEqual(["T01 R1: reference R9 isn't in the reference", "T01 R2: verdict 'maybe'"]);
  });
});

describe('Stage 1b: a sheet’s checks', () => {
  const text = 'My neighbour borrowed my ladder and hasn’t brought it back.';
  it('accepts the guide’s worked example', () => {
    const rows = [
      row('R1', 'R', { basis: '"My neighbour borrowed my ladder"', derivation: 'restatement' }),
      row('R2', 'R', { basis: '"hasn\'t brought it back"', derivation: 'restatement' }),
      row('I1', 'I', { derivation: 'pragmatic inference' }),
      row('U1', 'U', { derivation: 'open question' }),
    ];
    expect(sectionProblems({ id: 'T01', seen: 'no', decline: 'no', rows }, text)).toEqual([]);
  });

  it('flags a category its derivation doesn’t lead to, a misquote, and a bad number', () => {
    const rows = [row('R1', 'R', { basis: '"borrowed my car"', derivation: 'restatement' }), row('L1', 'L', { derivation: 'pragmatic inference' }), row('I1', 'U', { derivation: 'open question' })];
    expect(sectionProblems({ id: 'T01', seen: 'no', decline: 'no', rows }, text)).toEqual([
      'T01 R1: "borrowed my car" isn\'t in the text',
      "T01 L1: pragmatic inference doesn't lead to L",
      'T01 I1: numbered for another category than U',
    ]);
  });
});

describe('Stage 1b, slice 1: the files', () => {
  const texts = new Map([...sectionsOf(read(`${SLICE}texts.md`))].map(([id, block]) => [id, block.match(/^> (.*)$/m)![1].trim()]));
  const ids = [...texts.keys()];
  const key = new Map(tablesIn(read(`${SLICE}key.md`))[0].rows.map((r) => [r[0], { source: r[1], passA: r[2] }]));
  const robustness = new Map(tablesIn(read(`${TRIAL}robustness.md`))[0].rows.map((r) => [r[0].replace(' ◆', ''), r[3]]));
  const groups = Object.fromEntries(ids.map((id) => [id, (/^R\d\d$/.test(key.get(id)!.source) ? 'robustness' : 'corpus') as Group]));

  it('has sixteen texts: the twelve depth cases and four robustness texts', () => {
    expect(ids).toEqual(Array.from({ length: 16 }, (_, k) => `T${String(k + 1).padStart(2, '0')}`));
    const sources = [...key.values()].map((k) => k.source).sort();
    expect(sources.filter((s) => !s.startsWith('R'))).toEqual(CASES.map((c) => c.id).sort());
    expect(sources.filter((s) => s.startsWith('R'))).toEqual(['R04', 'R06', 'R07', 'R20']);
    expect(robustness.size).toBe(20);
  });

  it('gives each text exactly as its source has it', () => {
    for (const [id, text] of texts) {
      const { source } = key.get(id)!;
      const expected = source.startsWith('R') ? robustness.get(source) : CASES.find((c) => c.id === source)?.text;
      expect(text, `${id} (${source})`).toBe(expected);
    }
  });

  it('is blind: the packet holds the texts and nothing of their cases or accounts', () => {
    const packet = read(`${SLICE}texts.md`);
    const lines = packet.split(/\r?\n/).filter((l) => l.trim());
    const body = lines.slice(lines.findIndex((l) => l.startsWith('## ')));
    expect(body.filter((l) => !/^## T\d\d$/.test(l) && !(l.startsWith('> ') && [...texts.values()].includes(l.slice(2).trim())))).toEqual([]);
    expect(packet.match(/\b([PEMU]\d{1,2}|R\d\d|P-CS3|P-CA|[EM]-\d)\b/g)).toBeNull();
    // The sheets' own words (not their tables, whose rows are numbered R1, U1 …) name no case either.
    const prose = (md: string) => md.split(/\r?\n/).filter((l) => !l.startsWith('|')).join('\n');
    for (const sheet of ['annotator-a.md', 'annotator-b.md', 'reference.md', 'alignment-a-b.md']) expect(prose(read(`${SLICE}${sheet}`)).match(/\b([PEMU]\d{1,2}|R\d\d|P-CS3|P-CA|[EM]-\d)\b/g), sheet).toBeNull();
  });

  it('keeps each sheet’s texts and rows well formed', () => {
    for (const sheet of ['annotator-a.md', 'annotator-b.md', 'reference.md']) {
      const sections = parseSheet(read(`${SLICE}${sheet}`));
      expect([...sections.keys()], sheet).toEqual(ids);
      for (const [id, s] of sections) {
        expect(s.text, `${sheet} ${id}`).toBe(texts.get(id));
        expect(sectionProblems(s, texts.get(id)!, { reference: sheet === 'reference.md' }), sheet).toEqual([]);
      }
    }
    const ab = parseAlignment(read(`${SLICE}alignment-a-b.md`));
    expect([...ab.keys()]).toEqual(ids);
    expect(tablesIn(read(`${SLICE}alignment-a-b.md`)).every((t) => t.header.join(' | ') === 'A | B | Other’s view')).toBe(true);
    // A text's alignment, once begun, covers both sheets and gives a view for each unpaired inference or question.
    const a = parseSheet(read(`${SLICE}annotator-a.md`));
    const b = parseSheet(read(`${SLICE}annotator-b.md`));
    const begun = ids.filter((id) => ab.get(id)!.length);
    const g = agreement(begun.map((id) => ({ id, a: a.get(id)!.rows, b: b.get(id)!.rows, aligned: ab.get(id)! })));
    expect([...g.unknownIds, ...g.unaligned]).toEqual([]);
  });

  it('groups the texts: twelve corpus texts, retrospective, and four robustness texts', () => {
    expect(Object.values(groups).filter((g) => g === 'corpus').length).toBe(12);
    expect(ids.filter((id) => groups[id] === 'robustness').map((id) => key.get(id)!.source).sort()).toEqual(['R04', 'R06', 'R07', 'R20']);
  });

  it('copies each pass A account exactly from the corpus', () => {
    const alignment = parsePassAAlignment(read(`${SLICE}alignment-pass-a.md`));
    const withPassA = ids.filter((id) => key.get(id)!.passA !== '—');
    expect([...alignment.keys()]).toEqual(withPassA);
    for (const id of withPassA) {
      const [file, marker] = key.get(id)!.passA.split(': ');
      const corpus = passAAccount(read(`../docs/visual-study/${file}`), marker);
      expect(alignment.get(id)!.map((r) => [r.id, r.statement, r.cat]), id).toEqual(corpus.map((r) => [r.id, r.statement, r.cat]));
    }
  });

  it('writes the results once every sheet is filled, and not before', () => {
    const files = Object.fromEntries(SHEETS.map((f) => [f, read(`${SLICE}${f}`)]));
    const results = sliceResults(ids, files, groups);
    const out = `${TRIAL}results/slice-1.json`;
    if (!results) {
      // Not yet annotated: nothing to compute.
      expect(existsSync(out)).toBe(false);
      return;
    }
    expect(results.agreement.unknownIds).toEqual([]);
    expect(results.passA.strict.problems).toEqual([]);
    mkdirSync(`${TRIAL}results`, { recursive: true });
    writeFileSync(out, JSON.stringify({ slice: 1, ...results }, null, 1));
  });
});

describe('Stage 1b: a slice’s results from filled sheets', () => {
  const ONE: Record<string, Group> = { T01: 'corpus' };
  const sheet = (rows: string) => `## T01\n\n> A text.\n\nSeen before: yes\nDecline: no\n\n| # | Statement | Cat. | Basis | Derivation | Would license |\n|---|---|---|---|---|---|\n${rows}`;
  const files = {
    'annotator-a.md': sheet('| R1 | a | R | "A text" | restatement | |\n| I1 | b | I | | pragmatic inference | |\n'),
    'annotator-b.md': sheet('| R1 | a | R | "A text" | restatement | |\n| L1 | b | L | | entailment | |\n'),
    'reference.md': sheet('| R1 | a | R | "A text" | restatement | |\n| I1 | b | I | | entailment | agreed |\n'),
    'alignment-a-b.md': '## T01\n\n| A | B |\n|---|---|\n| R1 | R1 |\n| I1 | L1 |\n',
    'alignment-pass-a.md': '## T01\n\n| Pass A | Statement | Cat. | Reference | Verdict |\n|---|---|---|---|---|\n| R1 | a | R | R1 | match |\n| L1 | b | L | I1 | match |\n',
  };

  it('computes agreement and both scorings, labelled', () => {
    const r = sliceResults(['T01'], files, ONE)!;
    expect(r.agreement.pairs).toBe(2);
    expect(r.agreement.confusion.I.L).toBe(1);
    expect(r.passA.label).toBe(PASS_A_LABEL);
    expect(r.passA.strict.overCommitted).toEqual(['T01 L1']);
    expect(r.passA.withAgreedLicences.overCommitted).toEqual([]);
    expect(r.seenBefore).toEqual({ a: ['T01'], b: ['T01'] });
    // On the implied/inferred boundary A said I and B said L, their only pair there: κ is 0.
    expect(r.agreement.kappaImpliedInferred).toBe(0);
    expect(r.categoriesHold).toBe('no');
    expect(r.byGroup.corpus).toEqual({ label: GROUP_LABELS.corpus, ids: ['T01'], agreement: r.agreement });
    expect(r.byGroup.robustness.ids).toEqual([]);
  });

  it('reports the corpus and robustness texts apart, and won’t compute until every text has a group and every alignment is finished', () => {
    const two = (md: string) => `${md}\n${md.replace('## T01', '## T02')}`;
    const both = Object.fromEntries(Object.entries(files).map(([f, md]) => [f, two(md)]));
    const r = sliceResults(['T01', 'T02'], both, { T01: 'corpus', T02: 'robustness' })!;
    expect(r.byGroup.corpus.ids).toEqual(['T01']);
    expect(r.byGroup.robustness).toMatchObject({ label: GROUP_LABELS.robustness, ids: ['T02'] });
    expect(r.byGroup.robustness.agreement.pairs).toBe(2);
    expect(r.agreement.pairs).toBe(4);
    expect(() => sliceResults(['T01', 'T02'], both, ONE)).toThrow('no group for T02');
    expect(sliceResults(['T01'], { ...files, 'alignment-a-b.md': '## T01\n\n| A | B |\n|---|---|\n| R1 | R1 |\n| I1 | — |\n| — | L1 |\n' }, ONE)).toBeNull();
  });

  it('is not measurable when a κ can’t be computed', () => {
    const r = sliceResults(['T01'], { ...files, 'alignment-a-b.md': '## T01\n\n| A | B |\n|---|---|\n| R1 | R1 |\n| I1 | — | plausible |\n| — | L1 |\n' }, ONE)!;
    // No implied/inferred pair at all.
    expect(r.agreement.kappaImpliedInferred).toBeNull();
    expect(r.categoriesHold).toBe('not measurable');
  });

  it('holds when both κ reach 0.6, fixed before annotation, and not when one falls short', () => {
    expect(THRESHOLD).toBe(0.6);
    const rows = (cats: string[]) => cats.map((c, k) => `| ${c}${k + 1} | s${k} | ${c} | | ${c === 'L' ? 'entailment' : 'pragmatic inference'} | |\n`).join('');
    const aCats = ['L', 'L', 'I', 'I'];
    const sheetOf = (cats: string[]) => `## T01\n\n> A text.\n\nSeen before: no\nDecline: no\n\n| # | Statement | Cat. | Basis | Derivation | Would license |\n|---|---|---|---|---|---|\n${rows(cats)}`;
    const align = (b: string[]) => `## T01\n\n| A | B |\n|---|---|\n${aCats.map((c, k) => `| ${c}${k + 1} | ${b[k]}${k + 1} |`).join('\n')}\n`;
    const agree = sliceResults(['T01'], { ...files, 'annotator-a.md': sheetOf(aCats), 'annotator-b.md': sheetOf(aCats), 'alignment-a-b.md': align(aCats) }, ONE)!;
    expect(agree.categoriesHold).toBe('yes');
    const bCats = ['L', 'I', 'I', 'L'];
    const differ = sliceResults(['T01'], { ...files, 'annotator-a.md': sheetOf(aCats), 'annotator-b.md': sheetOf(bCats), 'alignment-a-b.md': align(bCats) }, ONE)!;
    expect(differ.agreement.kappaImpliedInferred).toBe(0);
    expect(differ.categoriesHold).toBe('no');
  });

  it('is null while a sheet is unfilled', () => {
    expect(sliceResults(['T01'], { ...files, 'alignment-pass-a.md': files['alignment-pass-a.md'].replace('| match |\n', '| |\n') }, ONE)).toBeNull();
    expect(sliceResults(['T01'], { ...files, 'reference.md': sheet('') }, ONE)).toBeNull();
  });
});

describe('Stage 1b: the calibration packet', () => {
  const CALIBRATION = `${TRIAL}calibration/`;
  const textsOf = (md: string) => new Map([...sectionsOf(md)].map(([id, block]) => [id, block.match(/^> (.*)$/m)![1].trim()]));
  const texts = textsOf(read(`${CALIBRATION}texts.md`));
  const plain = (t: string) => t.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();

  it('has five texts, none of them a trial, robustness, unseen or guide text', () => {
    expect([...texts.keys()]).toEqual(['C01', 'C02', 'C03', 'C04', 'C05']);
    const guideExamples = [...read(`${TRIAL}guide.md`).matchAll(/^> \*(.+)\*$/gm), ...read(`${TRIAL}guide.md`).matchAll(/^\*\*"(.+)"\*\*$/gm)].map((m) => m[1]);
    expect(guideExamples.length).toBeGreaterThanOrEqual(7);
    const others = [
      ...CASES.map((c) => c.text),
      ...UNSEEN.map((c) => c.text),
      ...tablesIn(read(`${TRIAL}robustness.md`))[0].rows.map((r) => r[3]),
      ...textsOf(read(`${SLICE}texts.md`)).values(),
      ...guideExamples,
    ].map(plain);
    for (const [id, t] of texts) for (const o of others) expect(o.includes(plain(t)) || plain(t).includes(o), `${id} against "${o}"`).toBe(false);
  });

  it('gives each annotator a sheet of the same texts, well formed as filled', () => {
    for (const sheet of ['annotator-a.md', 'annotator-b.md']) {
      const sections = parseSheet(read(`${CALIBRATION}${sheet}`));
      expect([...sections.keys()], sheet).toEqual([...texts.keys()]);
      for (const [id, sec] of sections) {
        expect(sec.text, `${sheet} ${id}`).toBe(texts.get(id));
        expect(sectionProblems(sec, texts.get(id)!), sheet).toEqual([]);
      }
    }
  });
});
