import { Brief, briefProblems } from './brief';
import { AssetEntry } from './manifest';
import { isPng, svgProblems } from './svg-safety';

/**
 * S8 Assets: the generation path (milestone M7 stage C), closed by default. A provider is something
 * outside the project that makes pictures from a brief: an AI image service would be one. None is
 * configured, and choosing one is its own proposal (docs/plan.md §10), so nothing here runs unless
 * a person runs the authoring script with a provider they have set up (web/tools/visual-generate).
 *
 * The rules this module enforces, whatever the provider:
 * - it runs at authoring time only: the app never imports this module (a dependency rule checks),
 *   so no participant's session can reach a provider;
 * - a brief is a few words from fixed lists (brief.ts): no typed text can enter one;
 * - what comes back is distrusted: an SVG must be a plain picture that runs and fetches nothing, a
 *   PNG must be a PNG, sizes and weights are bounded;
 * - every candidate becomes a **draft** asset, with its provider, brief and seed on record. Nothing
 *   here can approve one: a person reviews it and records that in the catalogue.
 * Pure but for hashing: no file access, no network. The script writes the files.
 */

/** Something outside the project that makes pictures. */
export interface ImageProvider {
  /** Recorded with every asset it makes: lower-case words joined by hyphens. */
  readonly id: string;
  /** The licence its output comes under, recorded with each draft. */
  readonly licence: string;
  generate(request: { brief: Brief; seed: string }): Promise<readonly Candidate[]>;
}

/** One picture a provider gives back: the same picture for a light and for a dark ground. */
export interface Candidate {
  format: 'svg' | 'png';
  /** The size it is shown at, in CSS px. */
  width: number;
  height: number;
  light: Uint8Array;
  dark: Uint8Array;
}

export interface GenerateRequest {
  /** The id the draft asset gets (a second candidate gets `-2`, and so on). */
  id: string;
  brief: Readonly<Record<string, unknown>>;
  seed: string;
  /** The content key of the text alternative a person writes for it. */
  alt: string;
}

/** A draft asset and the files to write for it, at the paths its entry names. */
export interface Draft {
  entry: AssetEntry;
  files: { path: string; data: Uint8Array }[];
}

export const GENERATE_LIMITS = { maxBytes: 2_000_000, maxSide: 4096, maxCandidates: 8 } as const;
const WORD = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function sha256(data: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data as unknown as ArrayBuffer));
  return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Every problem with what a provider gave back; empty when it can be kept as a draft. */
export function candidateProblems(candidate: Candidate): string[] {
  const problems: string[] = [];
  const side = (n: number) => Number.isInteger(n) && n > 0 && n <= GENERATE_LIMITS.maxSide;
  if (!side(candidate.width) || !side(candidate.height)) problems.push(`its size is whole numbers up to ${GENERATE_LIMITS.maxSide}`);
  if (candidate.format !== 'svg' && candidate.format !== 'png') problems.push('it is an SVG or a PNG');
  for (const scheme of ['light', 'dark'] as const) {
    const data = candidate[scheme];
    // By shape, not `instanceof`: bytes made in another context (a worker, a test) are bytes too.
    if (!ArrayBuffer.isView(data) || !data.length) {
      problems.push(`its ${scheme} file is empty`);
      continue;
    }
    if (data.length > GENERATE_LIMITS.maxBytes) problems.push(`its ${scheme} file is over ${GENERATE_LIMITS.maxBytes} bytes`);
    if (candidate.format === 'png') {
      if (!isPng(data)) problems.push(`its ${scheme} file isn't a PNG`);
    } else if (candidate.format === 'svg') {
      let text: string | null = null;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(data);
      } catch {
        problems.push(`its ${scheme} file isn't text`);
      }
      if (text !== null) problems.push(...svgProblems(text).map((p) => `its ${scheme} file: ${p}`));
    }
  }
  return problems;
}

/**
 * Asks a provider for pictures and turns each into a draft asset. Throws, with the reasons, when
 * there is no provider, the brief isn't from the lists, or anything that comes back isn't safe to keep.
 */
export async function generateDrafts(provider: ImageProvider | undefined, request: GenerateRequest): Promise<Draft[]> {
  if (!provider) throw new Error('No provider is configured: generated images are off. Setting one up is its own proposal (docs/plan.md §10).');
  if (!WORD.test(provider.id) || !provider.licence?.trim()) throw new Error("A provider has an id (lower-case words joined by hyphens) and says its output's licence.");
  const wrong = briefProblems(request.brief);
  if (wrong.length) throw new Error(`The brief isn't from the lists: ${wrong.join('; ')}.`);
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(request.id)) throw new Error('An asset id is lower-case words joined by dots or hyphens.');
  if (!WORD.test(request.seed)) throw new Error('A seed is lower-case words joined by hyphens.');
  const brief = request.brief as unknown as Brief;
  const candidates = await provider.generate({ brief, seed: request.seed });
  if (!candidates.length) throw new Error(`Provider '${provider.id}' gave nothing back.`);
  if (candidates.length > GENERATE_LIMITS.maxCandidates) throw new Error(`Provider '${provider.id}' gave ${candidates.length} pictures; at most ${GENERATE_LIMITS.maxCandidates}.`);
  const drafts: Draft[] = [];
  for (const [i, candidate] of candidates.entries()) {
    const problems = candidateProblems(candidate);
    if (problems.length) throw new Error(`Picture ${i + 1} made by '${provider.id}' can't be kept: ${problems.join('; ')}.`);
    const id = i ? `${request.id}-${i + 1}` : request.id;
    const file = async (scheme: 'light' | 'dark') => {
      const data = candidate[scheme];
      return { path: `visuals/generated/${id}.${scheme}.${candidate.format}`, bytes: data.length, sha256: await sha256(data), data };
    };
    const [light, dark] = [await file('light'), await file('dark')];
    const strip = ({ data: _, ...facts }: typeof light) => facts;
    drafts.push({
      entry: {
        id,
        version: 1,
        files: { light: strip(light), dark: strip(dark) },
        width: candidate.width,
        height: candidate.height,
        alt: request.alt,
        origin: { kind: 'generated', provider: provider.id, brief: { ...brief }, seed: request.seed },
        licence: provider.licence,
        // Always a draft: only a person's review, recorded in the catalogue, approves an asset.
        status: 'draft',
      },
      files: [light, dark].map(({ path, data }) => ({ path, data })),
    });
  }
  return drafts;
}
