import type { CandidateAccount } from './account';
import { TRACK_A_MARKER } from './account';
import { CRITIC_SCHEMA, criticPrompt } from './prompts';
import type { Provider } from './provider';
import { STOPS_THE_RUN } from './provider';
import type { CriticReply, Reconciled } from './reconcile';
import { reconcile } from './reconcile';
import type { CallRecord, TextRecord } from './runner';
import { RESULT_LABEL, asProviderError, criticInput, parse, redact, redactDeep } from './runner';
import type { DevText } from './sources';
import type { Demotion, Validation } from './validate';
import { validate } from './validate';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The critic-only
 * review: the critic run against a candidate account already saved in a round, so that what the
 * critic does can be seen on a fixed account, apart from a newly generated one.
 *
 * - The saved record is only read. Nothing here can write to it, and no candidate is generated.
 * - The critic is sent exactly what the critic stage sends (`criticInput`), with the same prompt and
 *   schema, and the saved validation as the account's categories.
 * - Each review is saved apart from the candidate, and names the exact record it reviewed: its round,
 *   file and hash, and the candidate's own model, prompt hash, guide hash and provenance.
 * - One request per text, counted against the run's limit and spaced like any run. A provider error
 *   is recorded and, except for a blocked or malformed reply, stops the run. Nothing is retried.
 * - A finished review is skipped on a rerun only if it reviewed the same saved record with the same
 *   model, critic prompt and guide. Otherwise the run stops before any request.
 */

/** A saved candidate record: its round, its text id, and the file's exact contents. */
export interface SavedCandidate {
  round: string;
  id: string;
  raw: string;
}

export type ReviewOutcome = 'complete' | 'schema-failed' | 'reply-failed' | 'stopped';

export interface CriticReview {
  marker: typeof TRACK_A_MARKER;
  label: typeof RESULT_LABEL;
  kind: 'critic-only';
  textId: string;
  text: string;
  /** The exact candidate reviewed, as saved, and what it was made with. */
  reviewed: {
    round: string;
    file: string;
    /** The saved file's hash, as it was read. */
    sourceHash: string;
    candidateHash: string;
    model: string;
    promptHash?: string;
    guideHash?: string;
    stepHashes?: TextRecord['stepHashes'];
    date: string;
    provenance: CandidateAccount['provenance'];
    /** The saved validation's categories, as the critic was shown them. */
    categories: string[];
  };
  provider: string;
  /** The model asked to review. */
  model: string;
  date: string;
  guideHash: string;
  stepHashes: { critic: string };
  /** The version of the checks that applied the reply, by hash (from 2026-11-26). */
  checksHash?: string;
  /** The hash of exactly what the critic was sent. */
  inputHash: string;
  requests: number;
  durationMs: number;
  outcome: ReviewOutcome;
  error?: { kind: string; message: string; status?: number };
  calls: CallRecord[];
  schema?: { ok: boolean; problems: string[] };
  /** The critic's reply as given; null when it came back unusable. */
  critic?: CriticReply | null;
  /** The saved validation with the critic's reply applied (lowering only; additions never established). */
  reconciled?: Reconciled;
  /** What the critic lowered, by id. */
  lowered: ({ id: string } & Demotion)[];
  /** The critic's additions that were kept, with their computed categories. */
  added: string[];
  /** What was rejected: the critic's reply against its schema, or what reconciling it found. */
  rejected: string[];
}

export interface ReviewOptions {
  limit: number;
  minIntervalMs: number;
  /** The development set: the only texts a review may take. */
  allowed: readonly DevText[];
  guide: string;
  secrets: readonly string[];
  hash(s: string): string;
  now(): number;
  sleep(ms: number): Promise<void>;
  date: string;
  /** This text's review in the review round, if there is one. It may throw if the file can't be read. */
  previous(id: string): CriticReview | undefined;
  /** The version of the checks, by hash, as for a run: saved in each review, and compared on a rerun. */
  checksHash?: string;
  write(review: CriticReview): void;
  log(line: string): void;
}

export interface ReviewSummary {
  marker: typeof TRACK_A_MARKER;
  label: typeof RESULT_LABEL;
  kind: 'critic-only';
  provider: string;
  model: string;
  limit: number;
  requests: number;
  texts: { id: string; outcome: ReviewOutcome }[];
  skipped: string[];
  refused: { id: string; why: string }[];
  stoppedBecause?: string;
}

interface Planned {
  source: SavedCandidate;
  record: TextRecord & { candidate: CandidateAccount; validation: Validation };
  sourceHash: string;
}

const categoriesOf = (v: Validation) => v.statements.map((s) => `${s.id}:${s.category}`);
const demotionsOf = (v: Validation) => JSON.stringify(v.statements.map((s) => [s.id, s.category, s.demotions.map((d) => [d.rule, d.from, d.to])]));

/**
 * What a review would do, before any request: the saved records it can take, those it would skip as
 * already reviewed the same way, and those it refuses. A review round that differs is a mismatch,
 * and the whole run stops. The dry run shows this too, without a key.
 */
export function planReview(sources: readonly SavedCandidate[], model: string, o: Pick<ReviewOptions, 'allowed' | 'guide' | 'hash' | 'previous' | 'checksHash'>) {
  const allowed = new Map(o.allowed.map((t) => [t.id, t.text]));
  const guideHash = o.hash(o.guide);
  const criticHash = o.hash(`${criticPrompt(o.guide)}\n${JSON.stringify(CRITIC_SCHEMA)}`);
  const take: Planned[] = [];
  const skipped: string[] = [];
  const refused: { id: string; why: string }[] = [];
  const mismatches: string[] = [];
  for (const source of sources) {
    const refuse = (why: string) => refused.push({ id: source.id, why });
    let record: TextRecord;
    try {
      record = JSON.parse(source.raw) as TextRecord;
    } catch {
      refuse(`its saved record in ${source.round} is not valid JSON`);
      continue;
    }
    if (record.textId !== source.id) { refuse(`its saved record in ${source.round} is for ${record.textId}`); continue; }
    if (record.outcome !== 'complete' || !record.candidate || !record.validation) { refuse(`its saved record in ${source.round} has no complete candidate account (${record.outcome})`); continue; }
    if (allowed.get(source.id) !== record.text) { refuse('not in the synthetic development set, or its text has changed since'); continue; }
    if ((record.guideHash ?? record.candidate.provenance.guideHash) !== guideHash) { refuse('its candidate was made with a different guide'); continue; }
    // The critic is shown the saved categories. If the checks would now give others, they aren't what the code would show.
    const now = validate(record.candidate);
    if (demotionsOf(now) !== demotionsOf(record.validation)) { refuse(`the checks now give it ${categoriesOf(now).join(' ')}, not the saved ${categoriesOf(record.validation).join(' ')}`); continue; }

    const sourceHash = o.hash(source.raw);
    let prev: CriticReview | undefined;
    try {
      prev = o.previous(source.id);
    } catch (e) {
      mismatches.push(`${source.id}: its review can't be read (${e instanceof Error ? e.message : String(e)})`);
      continue;
    }
    if (prev && prev.outcome !== 'stopped') {
      const differs = [
        (prev.reviewed.round !== source.round || prev.reviewed.sourceHash !== sourceHash) && `another saved candidate (${prev.reviewed.round}/${prev.reviewed.file})`,
        prev.model !== model && `model ${prev.model}, not ${model}`,
        prev.stepHashes?.critic !== criticHash && 'a different critic prompt',
        prev.guideHash !== guideHash && 'a different guide',
        o.checksHash !== undefined && prev.checksHash !== o.checksHash && (prev.checksHash === undefined ? "without a record of the checks' version" : 'with other checks'),
      ].filter(Boolean);
      if (differs.length) mismatches.push(`${source.id}: reviewed ${differs.join(', ')}`);
      else skipped.push(source.id);
      continue;
    }
    take.push({ source, record: record as Planned['record'], sourceHash });
  }
  return { take, skipped, refused, mismatches, guideHash, criticHash };
}

export async function reviewSaved(provider: Provider, sources: readonly SavedCandidate[], o: ReviewOptions): Promise<ReviewSummary> {
  const summary: ReviewSummary = { marker: TRACK_A_MARKER, label: RESULT_LABEL, kind: 'critic-only', provider: provider.name, model: provider.model, limit: o.limit, requests: 0, texts: [], skipped: [], refused: [] };
  const plan = planReview(sources, provider.model, o);
  summary.skipped = plan.skipped;
  summary.refused = plan.refused;
  if (plan.mismatches.length) {
    summary.stoppedBecause = `review round mismatch, nothing sent: ${plan.mismatches.join('; ')}. Use a new --round for another candidate round, model, critic prompt, guide or checks.`;
    o.log(redact(summary.stoppedBecause, o.secrets));
    return redactDeep(summary, o.secrets);
  }
  const system = criticPrompt(o.guide);
  let last = -Infinity;

  for (const { source, record, sourceHash } of plan.take) {
    if (summary.requests + 1 > o.limit) {
      summary.stoppedBecause = `request limit: ${summary.requests} of ${o.limit} used`;
      break;
    }
    const candidate = record.candidate;
    const input = criticInput({ id: record.textId, text: record.text }, candidate, record.validation);
    const rec: CriticReview = {
      marker: TRACK_A_MARKER,
      label: RESULT_LABEL,
      kind: 'critic-only',
      textId: record.textId,
      text: record.text,
      reviewed: {
        round: source.round,
        file: `${source.id}.json`,
        sourceHash,
        candidateHash: o.hash(JSON.stringify(candidate)),
        model: record.model,
        promptHash: record.promptHash ?? candidate.provenance.promptHash,
        guideHash: record.guideHash ?? candidate.provenance.guideHash,
        ...(record.stepHashes ? { stepHashes: record.stepHashes } : {}),
        date: record.date,
        provenance: candidate.provenance,
        categories: categoriesOf(record.validation),
      },
      provider: provider.name,
      model: provider.model,
      date: o.date,
      guideHash: plan.guideHash,
      stepHashes: { critic: plan.criticHash },
      ...(o.checksHash !== undefined ? { checksHash: o.checksHash } : {}),
      inputHash: o.hash(input),
      requests: 0,
      durationMs: 0,
      outcome: 'complete',
      calls: [],
      lowered: [],
      added: [],
      rejected: [],
    };

    const wait = last + o.minIntervalMs - o.now();
    if (wait > 0) await o.sleep(wait);
    summary.requests++;
    rec.requests++;
    last = o.now();
    const t0 = o.now();
    try {
      const r = await provider.generate({ step: 'critic', system, user: input, schema: CRITIC_SCHEMA });
      rec.calls.push({ step: 'critic', model: r.model, complete: r.complete, finish: r.finish, usage: r.usage, durationMs: o.now() - t0, reply: r.text });
      const p = parse(r, CRITIC_SCHEMA);
      rec.schema = { ok: !p.problems.length, problems: p.problems };
      if (p.problems.length) {
        rec.outcome = r.complete ? 'schema-failed' : 'reply-failed';
        rec.critic = null;
        rec.rejected = p.problems.map((x) => `critic reply: ${x}`);
      } else {
        const critic = p.value as CriticReply;
        rec.critic = critic;
        const reconciled = reconcile(record.text, record.validation, critic, undefined);
        rec.reconciled = reconciled;
        rec.lowered = reconciled.statements.filter((s) => s.source === 'candidate').flatMap((s) => s.demotions.filter((d) => d.rule === 'critic').map((d) => ({ id: s.id, ...d })));
        rec.added = reconciled.statements.filter((s) => s.source === 'critic').map((s) => `${s.id}:${s.category}`);
        rec.rejected = reconciled.problems.filter((x) => !record.validation.problems.includes(x));
      }
    } catch (e) {
      const err = asProviderError(e);
      rec.calls.push({ step: 'critic', model: provider.model, complete: false, durationMs: o.now() - t0, error: { kind: err.kind, message: err.message, status: err.status } });
      rec.error = { kind: err.kind, message: err.message, status: err.status };
      if (STOPS_THE_RUN.includes(err.kind)) {
        rec.outcome = 'stopped';
        summary.stoppedBecause = `${err.kind}${err.status ? ` (${err.status})` : ''}: ${err.message}`;
      } else rec.outcome = 'reply-failed';
    }
    rec.durationMs = o.now() - t0;
    o.write(redactDeep(rec, o.secrets));
    summary.texts.push({ id: rec.textId, outcome: rec.outcome });
    o.log(redact(`${rec.textId}: ${rec.outcome}${rec.error ? ` (${rec.error.kind}: ${rec.error.message})` : ''}; reviewed ${source.round}/${source.id}.json; ${summary.requests} of ${o.limit} used`, o.secrets));
    if (summary.stoppedBecause) break;
  }
  return redactDeep(summary, o.secrets);
}
