import type { JsonSchema, Provider, ProviderReply, ProviderRequest } from '../provider';
import { ProviderError } from '../provider';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The Gemini adapter:
 * the only code that knows the provider is Google's Gemini Developer API. It doesn't import the SDK.
 * The run script builds the client from `geminiClientOptions` and hands it here, so offline tests
 * hand it a fake.
 *
 * - The model is set explicitly, and only a documented model is accepted. No alias, no automatic
 *   model choice, no fallback.
 * - JSON output through `responseMimeType` and `responseJsonSchema`. The schema is translated here,
 *   to the keywords the service supports.
 * - No tools of any kind (no grounding, no search, no code execution), and automatic function
 *   calling off.
 * - The client is built with retries off and for the Developer API only, never Enterprise or
 *   Vertex AI.
 */

/**
 * The models this adapter accepts, each checked against ai.google.dev (now aistudio.google.com/docs:
 * models, pricing, deprecations). Each is listed as stable, with a free tier, structured output and
 * no announced shutdown. Their free-tier limits are not published there. Google says they depend on
 * the project and are shown in AI Studio (aistudio.google.com/rate-limit), so the run script takes
 * them from you.
 */
export const GEMINI_MODELS: Readonly<Record<string, { status: string; checked: string }>> = {
  'gemini-3.8-flash': { status: 'stable; free tier listed', checked: '2026-11-25' },
  'gemini-3.5-flash-lite': { status: 'stable; free tier listed', checked: '2026-11-25' },
  'gemini-3.6-flash': { status: 'stable, previous-generation Flash; free tier listed; no shutdown announced', checked: '2026-11-25' },
};

/** The key, from GEMINI_API_KEY only, and a refusal of anything that would switch the client to a paid surface. */
export function geminiKey(env: Readonly<Record<string, string | undefined>>): string {
  for (const v of ['GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_GENAI_USE_ENTERPRISE'])
    if ((env[v] ?? '').toLowerCase() === 'true') throw new ProviderError('config', `${v} is set to true: this run uses the Gemini Developer API only. Unset it in this window.`);
  // Spaces or line breaks around a pasted key are dropped. Anything else that can't go in an HTTP
  // header is refused before a request, because Node's fetch would only report "fetch failed".
  const key = (env['GEMINI_API_KEY'] ?? '').trim();
  if (!key) throw new ProviderError('missing-key', 'GEMINI_API_KEY is not set in this window. No request was sent.');
  if (!/^[\x21-\x7E]+$/.test(key)) {
    // Says what kind of character is wrong, and how long the key is; never the key itself.
    const kinds = [/\s/.test(key) && 'a space or line break', /[\x00-\x08\x0E-\x1F\x7F]/.test(key) && 'a control character (often from Ctrl+V at a hidden prompt)', /[^\x00-\x7F]/.test(key) && 'a non-ASCII character'].filter(Boolean);
    throw new ProviderError('config', `GEMINI_API_KEY (${key.length} characters) contains ${kinds.join(' and ')}: it is not plain ASCII. Copy the key again and set it again. No request was sent.`);
  }
  return key;
}

/**
 * Options for `new GoogleGenAI(...)`: the Developer API, the key given, and no retries. The SDK sends
 * the timeout to the service as its deadline (`X-Server-Timeout`, in seconds): a reply that takes
 * longer ends in 504 DEADLINE_EXCEEDED.
 */
export function geminiClientOptions(apiKey: string, timeoutMs = 300_000): Record<string, unknown> {
  return {
    apiKey,
    vertexai: false,
    enterprise: false,
    httpOptions: { timeout: timeoutMs, retryOptions: { attempts: 1, httpStatusCodes: [] } },
  };
}

const SUPPORTED = ['type', 'properties', 'required', 'items', 'enum', 'additionalProperties', 'description', 'title'];

/** The schema in the keywords `responseJsonSchema` supports; anything else is dropped (and is still checked locally). */
export function toGeminiSchema(schema: JsonSchema): JsonSchema {
  const out: JsonSchema = {};
  for (const [k, v] of Object.entries(schema)) {
    if (!SUPPORTED.includes(k)) continue;
    if (k === 'properties') out[k] = Object.fromEntries(Object.entries(v as Record<string, JsonSchema>).map(([p, s]) => [p, toGeminiSchema(s)]));
    else if (k === 'items') out[k] = toGeminiSchema(v as JsonSchema);
    else if (k === 'enum' || k === 'required') out[k] = [...(v as unknown[])];
    else out[k] = v;
  }
  return out;
}

/** The part of the SDK client this adapter uses. */
export interface GeminiClient {
  models: { generateContent(request: { model: string; contents: string; config: Record<string, unknown> }): Promise<GeminiResponse> };
}

export interface GeminiResponse {
  text?: string;
  modelVersion?: string;
  candidates?: { finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; totalTokenCount?: number };
}

/** A failed request, as a provider error. 429 is quota or rate, and the run stops on it. */
export function geminiError(e: unknown): ProviderError {
  const status = typeof (e as { status?: unknown })?.status === 'number' ? (e as { status: number }).status : undefined;
  // Node's fetch reports a network or header problem only as "fetch failed"; the reason is in `cause`.
  const cause = (e as { cause?: { code?: unknown; message?: unknown } })?.cause;
  const why = cause ? [cause.code, cause.message].filter((x) => typeof x === 'string' && x).join(': ') : '';
  const message = `${e instanceof Error ? e.message : String(e)}${why ? ` (${why})` : ''}`;
  if (status === 429) return new ProviderError('quota', `quota or rate limit reached (RESOURCE_EXHAUSTED): ${message}`, status);
  if (status === 404) return new ProviderError('model', `model not found or not available: ${message}`, status);
  if (status === 401 || status === 403) return new ProviderError('auth', `not authorised (check the key, and the project's status in AI Studio): ${message}`, status);
  if (status === 400) return new ProviderError(/model/i.test(message) ? 'model' : 'invalid-request', message, status);
  if (status === 504) return new ProviderError('failure', `the service didn't finish before the deadline (504 DEADLINE_EXCEEDED); the deadline is --timeout: ${message}`, status);
  return new ProviderError('failure', message, status);
}

export function geminiProvider(client: GeminiClient, model: string): Provider {
  if (!GEMINI_MODELS[model]) throw new ProviderError('model', `'${model}' isn't one of the checked models (${Object.keys(GEMINI_MODELS).join(', ')}). No request was sent.`);
  return {
    name: 'gemini',
    model,
    async generate(r: ProviderRequest): Promise<ProviderReply> {
      let res: GeminiResponse;
      try {
        res = await client.models.generateContent({
          model,
          contents: r.user,
          config: {
            systemInstruction: r.system,
            responseMimeType: 'application/json',
            responseJsonSchema: toGeminiSchema(r.schema),
            candidateCount: 1,
            automaticFunctionCalling: { disable: true },
          },
        });
      } catch (e) {
        throw geminiError(e);
      }
      if (res.promptFeedback?.blockReason) throw new ProviderError('blocked', `the request was blocked: ${res.promptFeedback.blockReason}`);
      const finish = res.candidates?.[0]?.finishReason;
      const text = res.text ?? '';
      if (!text) throw new ProviderError('malformed', `the reply has no text${finish ? ` (finish: ${finish})` : ''}`);
      const u = res.usageMetadata;
      const usage = u ? Object.fromEntries(Object.entries({ input: u.promptTokenCount, output: u.candidatesTokenCount, thinking: u.thoughtsTokenCount, total: u.totalTokenCount }).filter(([, v]) => typeof v === 'number')) as Record<string, number> : undefined;
      return { model: res.modelVersion ?? model, text, complete: finish === undefined || finish === 'STOP', finish, usage };
    },
  };
}
