/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The provider
 * interface: everything the runner needs from a model service, and nothing that names one. An
 * adapter (`providers/`) implements it; nothing outside the adapter knows which provider is used.
 * No SDK is imported here.
 */
export type Step = 'connectivity' | 'candidate' | 'critic' | 'entailment';

/** A JSON Schema, as the runner holds it; an adapter translates it to what its service supports. */
export type JsonSchema = Record<string, unknown>;

export interface ProviderRequest {
  step: Step;
  system: string;
  user: string;
  schema: JsonSchema;
}

export interface ProviderReply {
  /** The model that answered, as the service reports it. */
  model: string;
  /** The reply's text: JSON, if the service kept to the schema. */
  text: string;
  /** Whether the service says the reply finished normally; `finish` says how it ended. */
  complete: boolean;
  finish?: string;
  /** Token counts, if the service returns them. */
  usage?: Record<string, number>;
}

/**
 * Why a request failed. The runner stops the whole run on every kind but `blocked` and `malformed`,
 * which concern one text's reply only. It never retries.
 */
export type ProviderErrorKind = 'missing-key' | 'config' | 'quota' | 'model' | 'auth' | 'invalid-request' | 'blocked' | 'malformed' | 'failure';

export const STOPS_THE_RUN: readonly ProviderErrorKind[] = ['missing-key', 'config', 'quota', 'model', 'auth', 'invalid-request', 'failure'];

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly status?: number;
  constructor(kind: ProviderErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ProviderError';
    this.kind = kind;
    this.status = status;
  }
}

export interface Provider {
  /** The service's name, recorded as data; the runner never branches on it. */
  readonly name: string;
  /** The model asked for, set explicitly: no alias, no automatic choice, no fallback. */
  readonly model: string;
  generate(request: ProviderRequest): Promise<ProviderReply>;
}
