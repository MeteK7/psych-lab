import type { Predicate } from '../../../shared/visual';

/**
 * STUDY CODE, Track A (docs/interpretation-dev/; TRACK-A: AI-generated, development only, not
 * validated). The account schema: what an interpreter proposes for a text, before the validator
 * computes and lowers its categories. Its categories and derivations are the annotation guide's
 * (docs/interpretation-trial/guide.md §4), so a candidate can later be scored against a human
 * reference. Nothing here is drawn: mapping an account to a representation is A3.
 */
export const TRACK_A_MARKER = 'TRACK-A: AI-generated, development only, not validated.';

export const CATEGORIES = ['R', 'L', 'I', 'P', 'U'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Established: drawn as fact. */
export const ESTABLISHED: readonly Category[] = ['R', 'L'];

export const DERIVATIONS = ['restatement', 'entailment', 'presupposition', 'conventional meaning', 'pragmatic inference', 'world knowledge', 'alternative', 'open question'] as const;
export type Derivation = (typeof DERIVATIONS)[number];

/**
 * The strongest category each derivation can reach (guide §4). Entailment, presupposition and
 * conventional meaning reach L only through a licensed pattern; the validator decides that.
 */
export const DERIVATION_CEILING: Record<Derivation, Category> = {
  restatement: 'R',
  entailment: 'L',
  presupposition: 'L',
  'conventional meaning': 'L',
  'pragmatic inference': 'I',
  'world knowledge': 'I',
  alternative: 'P',
  'open question': 'U',
};

/** Who wrote a candidate. */
export type Author = 'model' | 'assistant' | 'fixture';

export interface Provenance {
  marker: typeof TRACK_A_MARKER;
  author: Author;
  /** The model asked, and the one that served the reply (they differ after a fallback). */
  model?: string;
  servedBy?: string;
  critic?: string;
  /** Hashes of the prompt and of the guide the candidate was written against. */
  promptHash?: string;
  guideHash?: string;
  date: string;
}

export interface CandidateStatement {
  id: string;
  /** The claim, in plain words. */
  statement: string;
  derivation: Derivation;
  /** Exact words of the text the statement rests on. Required for R and L; for P, the options are quoted instead. */
  quotes: readonly string[];
  /**
   * The guide's Basis column (§5): for anything not restated, a short reason, naming the device when
   * there is one ("sarcasm: …", "hedged: …"). Track A rule (2026-11-26): an inferred or unknown
   * statement with no quote needs one.
   */
  basis?: string;
  /**
   * For an alternative: whose possibilities they are, in the text's words ("Rana"), or "the writer".
   * Track A rule (2026-11-26): a possibility set someone considers is theirs, not a complete list.
   */
  holder?: string;
  /** The licensed pattern claimed, by id (`licences.ts`), for an implication. */
  licence?: string;
  /** The interpreter would license this implication although no pattern does (evidence for the licensed-pattern review). */
  wouldLicense?: boolean;
  /** For an alternative: the options the text itself offers, each in its own words. */
  options?: readonly string[];
  /** The statement reports an instruction in the text ("the text tells the reader to …"), not what the instruction asks. */
  aboutInstruction?: boolean;
  /** A predicate form, if proposed (mapped in A3). For an implied statement it must be the one its licence gives. */
  say?: Predicate;
  /** What the interpreter is unsure of, and readings it considered. Never drawn. */
  uncertainty?: string;
  competing?: readonly string[];
}

export interface CandidateAccount {
  v: 1;
  textId: string;
  text: string;
  statements: readonly CandidateStatement[];
  decline: { decline: boolean; why?: string };
  provenance: Provenance;
}

/**
 * The JSON schema a model's reply is held to (structured outputs, A2). The predicate form is left
 * open here and checked against the contract when an account is mapped (A3).
 */
export const CANDIDATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['statements', 'decline'],
  properties: {
    statements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // `basis` and `holder` are required so the model always fills them (2026-11-26): left optional,
        // `holder` was left out (dev-4-lite, D002). It is empty for anything but an alternative.
        required: ['id', 'statement', 'derivation', 'quotes', 'basis', 'holder'],
        properties: {
          id: { type: 'string' },
          statement: { type: 'string' },
          derivation: { type: 'string', enum: [...DERIVATIONS] },
          quotes: { type: 'array', items: { type: 'string' } },
          basis: { type: 'string' },
          holder: { type: 'string' },
          licence: { type: 'string' },
          wouldLicense: { type: 'boolean' },
          options: { type: 'array', items: { type: 'string' } },
          aboutInstruction: { type: 'boolean' },
          uncertainty: { type: 'string' },
          competing: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    decline: {
      type: 'object',
      additionalProperties: false,
      required: ['decline'],
      properties: { decline: { type: 'boolean' }, why: { type: 'string' } },
    },
  },
} as const;
