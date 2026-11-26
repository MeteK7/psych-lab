import type { Category } from './account';
import { CATEGORIES, TRACK_A_MARKER } from './account';
import type { Outcome, TextRecord } from './runner';
import { RESULT_LABEL } from './runner';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). Exploratory counts
 * over a recorded round: what the model proposed and where the checks lowered it. They describe model
 * output. They are not agreement, accuracy or reliability, and nothing here is compared with a human
 * reference.
 */
export interface Exploration {
  marker: typeof TRACK_A_MARKER;
  label: string;
  texts: number;
  outcomes: Record<Outcome, number>;
  /** Final categories after every check that ran: the candidate's statements, and the critic's additions apart. */
  categories: { candidate: Record<Category, number>; critic: Record<Category, number> };
  loweredByRule: Record<string, number>;
  rejected: number;
  /** The Track A flags (validate.ts): inferences with no basis, possibility sets with no holder. */
  flags: string[];
  schemaProblems: string[];
  declined: string[];
  /** Texts where the critic (if it ran) says the candidate obeyed an instruction in the text. */
  obeyedInstruction: string[];
  /** Calls answered by a model other than the one asked for. */
  otherModel: { id: string; step: string; model: string }[];
  /** Requests in the texts' latest records. */
  requests: number;
  /** Every request sent in the round, from its attempt log; null when there is no log. */
  requestsSent: number | null;
  attempts: number | null;
  usage: Record<string, number>;
  errors: { id: string; kind: string; message: string }[];
}

export const EXPLORATION_LABEL = `Exploratory counts. ${RESULT_LABEL} Not agreement, accuracy or reliability.`;

const zero = () => Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;

export function explore(records: readonly TextRecord[], attempts?: readonly TextRecord[]): Exploration {
  const out: Exploration = {
    marker: TRACK_A_MARKER,
    label: EXPLORATION_LABEL,
    texts: records.length,
    outcomes: { complete: 0, 'schema-failed': 0, 'reply-failed': 0, stopped: 0 },
    categories: { candidate: zero(), critic: zero() },
    loweredByRule: {},
    rejected: 0,
    flags: [],
    schemaProblems: [],
    declined: [],
    obeyedInstruction: [],
    otherModel: [],
    requests: 0,
    requestsSent: attempts ? attempts.reduce((n, a) => n + a.requests, 0) : null,
    attempts: attempts ? attempts.length : null,
    usage: {},
    errors: [],
  };
  for (const r of records) {
    out.outcomes[r.outcome]++;
    out.requests += r.requests;
    out.rejected += r.rejected.length;
    out.flags.push(...(r.reconciled?.flags ?? r.validation?.flags ?? []));
    for (const p of r.schema?.problems ?? []) out.schemaProblems.push(`${r.textId}: ${p}`);
    if (r.error) out.errors.push({ id: r.textId, kind: r.error.kind, message: r.error.message });
    if (r.candidate?.decline.decline) out.declined.push(r.textId);
    if (r.critic?.obeyedInstruction) out.obeyedInstruction.push(r.textId);
    for (const l of r.lowered) out.loweredByRule[l.rule] = (out.loweredByRule[l.rule] ?? 0) + 1;
    for (const c of r.calls) {
      if (c.model && !c.error && !c.model.startsWith(r.model)) out.otherModel.push({ id: r.textId, step: c.step, model: c.model });
      for (const [k, v] of Object.entries(c.usage ?? {})) out.usage[k] = (out.usage[k] ?? 0) + v;
    }
    const statements = r.reconciled?.statements ?? r.validation?.statements.map((s) => ({ ...s, source: 'candidate' as const })) ?? [];
    for (const s of statements) out.categories[s.source][s.category]++;
  }
  return out;
}
