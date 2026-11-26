// STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated).
//
// Runs texts from the synthetic development set (docs/interpretation-dev/dev-set/texts.md) through a
// provider: one candidate request per text, then the validator (code). The critic and entailment
// stages run only with --stages. Records go to docs/interpretation-dev/runs/<round>/, one file per text.
//
// From web/, in a PowerShell window where GEMINI_API_KEY is set:
//   node --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --dry --model gemini-3.8-flash
//   node --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --connectivity --model gemini-3.8-flash
//   node --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --model gemini-3.8-flash --limit 5 --rpm 5 --only D001,D002
//
// Options:
//   --model <id>        required; one of the checked models (providers/gemini.ts)
//   --limit <n>         the most requests this run sends, all stages counted (default 10)
//   --rpm <n>           requests per minute to keep under: take it from AI Studio (default 5)
//   --stages <list>     optional stages: critic, entailment (default: none)
//   --only <ids>        just these development-set ids
//   --round <name>      the records' folder (default dev-1); a stopped round resumes, skipping finished texts
//   --timeout <s>       how long one request may take, in seconds; sent to the service as its deadline (default 300)
//   --connectivity      one request, no study text, then stop
//   --dry               list what would run; no key needed, no request
//
// Critic-only review of saved candidates (review.ts): the critic, and nothing else, run against the
// candidate accounts already saved in a round. The saved records are only read; reviews go to
// docs/interpretation-dev/reviews/<round>/. One request per text.
//   --review-from <round>  the round whose saved candidates are reviewed, for example dev-1-lite
//   --round <name>         required with --review-from: the reviews' folder
//   node --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --dry --review-from dev-1-lite --round crit-1 --model gemini-3.5-flash-lite --only D003,D005
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { TRACK_A_MARKER } from '../../src/app/pages/lab/interpret/account';
import { FIXTURES } from '../../src/app/pages/lab/interpret/fixtures';
import { ProviderError } from '../../src/app/pages/lab/interpret/provider';
import type { Stage, TextRecord } from '../../src/app/pages/lab/interpret/runner';
import { STAGES, connectivity, redact, runTexts } from '../../src/app/pages/lab/interpret/runner';
import type { CriticReview } from '../../src/app/pages/lab/interpret/review';
import { planReview, reviewSaved } from '../../src/app/pages/lab/interpret/review';
import { corpusTexts, devSelection, readDevSet, robustnessTexts } from '../../src/app/pages/lab/interpret/sources';
import { UNSEEN } from '../../src/app/pages/lab/study/unseen';
import { sectionsOf, tablesIn } from '../../src/app/pages/lab/trial/sheets';
import { makeProvider } from './providers/gemini.mts';

const DOCS = '../docs/';
const read = (p: string) => readFileSync(p, 'utf-8');
const sha = (s: string) => createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex');
const option = (name: string) => {
  const k = process.argv.indexOf(`--${name}`);
  return k > 0 ? process.argv[k + 1] : undefined;
};
const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const model = option('model') ?? fail('--model is required, for example --model gemini-3.8-flash.');
const limit = Number(option('limit') ?? 10);
const rpm = Number(option('rpm') ?? 5);
const stages = (option('stages')?.split(',').filter(Boolean) ?? []) as Stage[];
const only = option('only')?.split(',').filter(Boolean);
const reviewFrom = option('review-from');
if (reviewFrom !== undefined && !option('round')) fail('--review-from needs --round: a name for the reviews\' folder, for example --round crit-1.');
if (reviewFrom !== undefined && stages.length) fail('--review-from runs the critic only; leave out --stages.');
if (reviewFrom !== undefined && !/^[\w-]+$/.test(reviewFrom)) fail('--review-from is a round name: letters, digits, - and _ only.');
const round = option('round') ?? 'dev-1';
const timeout = Number(option('timeout') ?? 300);
if (!Number.isInteger(limit) || limit < 1) fail('--limit is a whole number, 1 or more.');
if (!(rpm > 0)) fail('--rpm is a number above 0.');
for (const s of stages) if (!STAGES.includes(s)) fail(`--stages takes ${STAGES.join(', ')}; not '${s}'.`);
if (!/^[\w-]+$/.test(round)) fail('--round is letters, digits, - and _ only.');
if (!(timeout >= 10 && timeout <= 600)) fail('--timeout is a number of seconds, from 10 to 600.');

// The protected texts, which no run may take.
const quoted = (md: string) => [...sectionsOf(md).values()].map((b) => b.match(/^> (.*)$/m)![1]);
const guide = read(`${DOCS}interpretation-trial/guide.md`);
const protectedTexts = [
  ...['psychology', 'education', 'planning', 'stress'].flatMap((d) => corpusTexts(read(`${DOCS}visual-study/corpus-${d}.md`)).map((s) => s.text)),
  ...robustnessTexts(tablesIn(read(`${DOCS}interpretation-trial/robustness.md`))[0].rows).map((s) => s.text),
  ...UNSEEN.map((c) => c.text),
  ...quoted(read(`${DOCS}interpretation-trial/calibration/texts.md`)),
  ...quoted(read(`${DOCS}interpretation-trial/slice-1/texts.md`)),
  ...tablesIn(read(`${DOCS}interpretation-dev/held-out/texts.md`))[0].rows.map((r) => r[3]),
  ...[...guide.matchAll(/^> \*(.+)\*$/gm), ...guide.matchAll(/^\*\*"(.+)"\*\*$/gm)].map((m) => m[1]),
  ...FIXTURES.map((f) => f.text),
];

// The version of the checks, by hash: every file that turns a reply into categories.
const CHECKS = ['account.ts', 'licences.ts', 'validate.ts', 'reconcile.ts', 'schema-check.ts'];
const checksHash = sha(CHECKS.map((f) => `${f}\n${read(`src/app/pages/lab/interpret/${f}`)}`).join('\n'));

const dev = readDevSet(read(`${DOCS}interpretation-dev/dev-set/texts.md`));
if (dev.problems.length) fail(`The development set has problems:\n- ${dev.problems.join('\n- ')}`);
const { take, refused } = devSelection(dev.texts, protectedTexts, only);

console.log(TRACK_A_MARKER);

if (reviewFrom !== undefined) {
  // The saved records are read here, once, as they are, and never written.
  const FROM = `${DOCS}interpretation-dev/runs/${reviewFrom}/`;
  const REVIEWS = `${DOCS}interpretation-dev/reviews/${round}/`;
  if (!existsSync(FROM)) fail(`There is no round '${reviewFrom}' in docs/interpretation-dev/runs/.`);
  const missing = take.filter((t) => !existsSync(`${FROM}${t.id}.json`)).map((t) => ({ id: t.id, why: `no saved record in ${reviewFrom}` }));
  const sources = take.filter((t) => existsSync(`${FROM}${t.id}.json`)).map((t) => ({ round: reviewFrom, id: t.id, raw: read(`${FROM}${t.id}.json`) }));
  const previous = (id: string) => {
    if (!existsSync(`${REVIEWS}${id}.json`)) return undefined;
    try {
      return JSON.parse(read(`${REVIEWS}${id}.json`)) as CriticReview;
    } catch {
      throw new Error(`${id}.json is not valid JSON`);
    }
  };
  const plan = planReview(sources, model, { allowed: dev.texts, guide, hash: sha, previous, checksHash });
  console.log(`Critic-only review of ${reviewFrom}'s saved candidates, into reviews/${round}. Model ${model}; limit ${limit} requests; ${rpm} per minute.`);
  console.log(`To review: ${plan.take.map((p) => p.source.id).join(', ') || 'none'} (1 request each).${plan.skipped.length ? ` Already reviewed the same way: ${plan.skipped.join(', ')}.` : ''}`);
  const refusedAll = [...refused, ...missing, ...plan.refused];
  if (refusedAll.length) console.log(`Refused: ${refusedAll.map((r) => `${r.id} (${r.why})`).join('; ')}`);
  if (plan.mismatches.length) console.log(`Mismatch, nothing would be sent: ${plan.mismatches.join('; ')}`);
  if (process.argv.includes('--dry')) process.exit(0);
  if (plan.mismatches.length) fail('Nothing was sent. Use a new --round for another candidate round, model, critic prompt or guide.');
  if (!plan.take.length) fail('Nothing to review. No request was sent.');

  let made: ReturnType<typeof makeProvider>;
  try {
    made = makeProvider(model, process.env, timeout * 1000);
  } catch (e) {
    fail(e instanceof ProviderError ? `${e.kind}: ${e.message}` : 'The provider could not be set up. No request was sent.');
  }
  const date = new Date().toISOString().slice(0, 10);
  mkdirSync(REVIEWS, { recursive: true });
  const summary = await reviewSaved(made!.provider, sources, {
    limit,
    minIntervalMs: Math.ceil(60_000 / rpm),
    allowed: dev.texts,
    guide,
    secrets: made!.secrets,
    hash: sha,
    now: Date.now,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    date,
    previous,
    checksHash,
    // Only into the reviews' folder: the latest review per text, and every attempt appended.
    write: (rec) => {
      writeFileSync(`${REVIEWS}${rec.textId}.json`, JSON.stringify(rec, null, 1));
      appendFileSync(`${REVIEWS}attempts.jsonl`, `${JSON.stringify({ loggedAt: new Date().toISOString(), ...rec })}\n`);
    },
    log: (line) => console.log(line),
  });
  const finished = { ...summary, from: reviewFrom, refused: [...refused, ...missing, ...summary.refused], date, at: new Date().toISOString() };
  writeFileSync(`${REVIEWS}summary.json`, JSON.stringify(finished, null, 1));
  appendFileSync(`${REVIEWS}runs.jsonl`, `${JSON.stringify(finished)}\n`);
  console.log(redact(`Done: ${summary.requests} request(s) of ${limit}.${summary.stoppedBecause ? ` Stopped: ${summary.stoppedBecause}` : ''}`, made!.secrets));
  process.exit(0);
}

const perText = 1 + stages.length;
if (!process.argv.includes('--connectivity')) {
  console.log(`Model ${model}; limit ${limit} requests; ${rpm} per minute; stages: ${stages.join(', ') || 'none'}.`);
  console.log(`Texts: ${take.map((t) => t.id).join(', ') || 'none'} (up to ${perText} request(s) each).`);
  if (refused.length) console.log(`Refused: ${refused.map((r) => `${r.id} (${r.why})`).join('; ')}`);
}
if (process.argv.includes('--dry')) process.exit(0);
if (!process.argv.includes('--connectivity') && !take.length) fail('No development-set text to run. Write texts in docs/interpretation-dev/dev-set/texts.md.');

let built: ReturnType<typeof makeProvider>;
try {
  built = makeProvider(model, process.env, timeout * 1000);
} catch (e) {
  fail(e instanceof ProviderError ? `${e.kind}: ${e.message}` : 'The provider could not be set up. No request was sent.');
}
const { provider, secrets } = built!;
const date = new Date().toISOString().slice(0, 10);

if (process.argv.includes('--connectivity')) {
  const out = `${DOCS}interpretation-dev/runs/connectivity/`;
  mkdirSync(out, { recursive: true });
  const r = await connectivity(provider, { secrets, now: Date.now, date });
  // One file per attempt, named by its UTC time, so no attempt overwrites another.
  writeFileSync(`${out}${new Date().toISOString().replace(/[:.]/g, '-')}-${model}.json`, JSON.stringify({ ...r, at: new Date().toISOString() }, null, 1));
  console.log(redact(r.ok ? `Connectivity: OK (${r.call?.model}, ${r.durationMs} ms).` : `Connectivity: failed (${r.error ? `${r.error.kind}: ${r.error.message}` : `reply: ${r.call?.reply}`}).`, secrets));
  process.exit(r.ok ? 0 : 1);
}

const OUT = `${DOCS}interpretation-dev/runs/${round}/`;
mkdirSync(OUT, { recursive: true });
const summary = await runTexts(provider, take, {
  limit,
  stages,
  minIntervalMs: Math.ceil(60_000 / rpm),
  allowed: dev.texts,
  guide,
  checksHash,
  secrets,
  hash: sha,
  now: Date.now,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  date,
  // The text's latest record; a file that can't be read throws, and the run stops before any request.
  previous: (id) => {
    if (!existsSync(`${OUT}${id}.json`)) return undefined;
    try {
      return JSON.parse(read(`${OUT}${id}.json`)) as TextRecord;
    } catch {
      throw new Error(`${id}.json is not valid JSON`);
    }
  },
  // The latest record per text, and every attempt appended to attempts.jsonl, which is never rewritten.
  write: (rec) => {
    writeFileSync(`${OUT}${rec.textId}.json`, JSON.stringify(rec, null, 1));
    appendFileSync(`${OUT}attempts.jsonl`, `${JSON.stringify({ loggedAt: new Date().toISOString(), ...rec })}\n`);
  },
  log: (line) => console.log(line),
});
const finished = { ...summary, refused: [...refused, ...summary.refused], date, at: new Date().toISOString() };
writeFileSync(`${OUT}summary.json`, JSON.stringify(finished, null, 1));
appendFileSync(`${OUT}runs.jsonl`, `${JSON.stringify(finished)}\n`);
console.log(redact(`Done: ${summary.requests} request(s) of ${limit}.${summary.stoppedBecause ? ` Stopped: ${summary.stoppedBecause}` : ''}`, secrets));
