/**
 * The screenshot baselines (milestone M8, S10): one list of the compositions a review accepted,
 * which drives the one baseline harness (`e2e/visual-lab.spec.ts`, "approved baselines"). Each
 * shot is drawn on the parity page's test surface at the width it was approved at, in light, dark
 * and forced colours.
 *
 * A baseline changes only with an accepted entry in `docs/visual-reviews.md` that names it
 * (`docs/visual-system.md` §10). `lab-baselines.spec.ts` keeps this list, the review log and the
 * snapshot folder in step: no image without an accepted entry, no entry without its images, and
 * images go stale when a composition's version moves past the one its review accepted.
 *
 * Adding baselines for a newly accepted composition: one entry here, plus its review entry.
 * Pure data, no imports: the browser tests read it too.
 */

export interface AcceptedComposition {
  /** The composition's id, as its scene or instrument declares it. */
  composition: string;
  /** The version a review accepted; it must be the version the composition is drawn at now. */
  version: number;
  /** The review entries behind it (`docs/visual-reviews.md`): one approves the images, one accepts `composition@version`. */
  entries: number[];
  /** The width the images are captured at, in CSS px. */
  width: number;
  /** Each state or answer set: its name in the image files, and the parity case that draws it. */
  shots: { key: string; case: string }[];
}

export const ACCEPTED: readonly AcceptedComposition[] = [
  {
    composition: 'mcii.path',
    version: 4,
    // Entry 1 approved the images at @3; entry 2 accepted @4, which adds motion and leaves the states as they were.
    entries: [1, 2],
    width: 480,
    shots: ['future', 'contrast', 'plan', 'aside'].map((key) => ({ key, case: `mcii.path.${key}` })),
  },
  {
    composition: 'cs2.cause-map',
    version: 1,
    entries: [3],
    width: 480,
    shots: ['start', 'placing', 'spread', 'heavy', 'six'].map((key) => ({ key, case: `cause-map.${key}` })),
  },
];

export type BaselineScheme = 'light' | 'dark' | 'forced';
export const BASELINE_SCHEMES: readonly BaselineScheme[] = ['light', 'dark', 'forced'];

/** The name a shot's image is captured under, e.g. `mcii.path-future-light.png`. */
export function baselineName(composition: string, key: string, scheme: BaselineScheme): string {
  return `${composition}-${key}-${scheme}.png`;
}

/** The file the browser tests store it as, in `e2e/visual-lab.spec.ts-snapshots/` (dots become dashes; the platform is added). */
export function baselineFile(composition: string, key: string, scheme: BaselineScheme, platform = 'win32'): string {
  return `${baselineName(composition, key, scheme).replace(/\.png$/, '').replace(/[^A-Za-z0-9-]/g, '-')}-${platform}.png`;
}

/** One review entry, as `docs/visual-reviews.md` gives it. */
export interface ReviewEntry {
  number: number;
  /** What the heading names, e.g. `mcii.path@4`. */
  item: string | null;
  accepted: boolean;
  /** The image files its "Baselines approved" section names. */
  approves: string[];
}

/** The review log's entries: each heading `## Entry N · … · \`id@version\``, its verdict and the files it approves. */
export function parseReviews(markdown: string): ReviewEntry[] {
  return markdown
    .split(/^## (?=Entry \d+)/m)
    .slice(1)
    .map((section) => {
      const heading = section.split('\n', 1)[0];
      const verdict = /### Verdict\s*\n+\s*\*\*(\w+)\*\*/.exec(section)?.[1];
      const approved = /### Baselines approved\s*\n([\s\S]*?)(?=\n### |\n---|$)/.exec(section)?.[1] ?? '';
      return {
        number: Number(/^Entry (\d+)/.exec(heading)![1]),
        item: /`([^`@]+@\d+)`/.exec(heading)?.[1] ?? null,
        accepted: verdict === 'Accept',
        approves: [...approved.matchAll(/`([^`]+\.png)`/g)].map((m) => m[1]),
      };
    });
}

/**
 * The three guards, as problems in words (none when all is in step):
 * 1. no image without an accepted entry: every file in the folder belongs to a listed shot, and
 *    is named by an accepted entry behind its composition;
 * 2. no entry without its images: every listed shot has its three files;
 * 3. stale images: the composition is drawn at the version its review accepted (an entry behind it
 *    names `composition@version` and accepts it).
 * `drawn` gives the composition and version each parity case draws now (undefined: no such case).
 */
export function baselineProblems(
  accepted: readonly AcceptedComposition[],
  reviews: readonly ReviewEntry[],
  files: readonly string[],
  drawn: (caseKey: string) => { id: string; version: number } | undefined,
): string[] {
  const problems: string[] = [];
  const expected = new Map<string, AcceptedComposition>();
  for (const a of accepted) {
    const entries = a.entries.map((n) => ({ n, entry: reviews.find((r) => r.number === n) }));
    for (const { n, entry } of entries) {
      if (!entry) problems.push(`${a.composition}: there is no review entry ${n}`);
      else if (!entry.accepted) problems.push(`${a.composition}: review entry ${n} doesn't accept it (its verdict isn't Accept)`);
      else if (!entry.item?.startsWith(`${a.composition}@`)) problems.push(`${a.composition}: review entry ${n} is about ${entry.item ?? 'something else'}`);
    }
    const accepting = entries.flatMap(({ entry }) => (entry?.accepted ? [entry] : []));
    if (!accepting.some((e) => e.item === `${a.composition}@${a.version}`))
      problems.push(`${a.composition}: no accepted review entry names ${a.composition}@${a.version}`);
    for (const shot of a.shots) {
      const now = drawn(shot.case);
      if (!now) problems.push(`${a.composition}: there is no parity case '${shot.case}'`);
      else if (now.id !== a.composition) problems.push(`${a.composition}: the parity case '${shot.case}' draws ${now.id}`);
      else if (now.version !== a.version)
        problems.push(
          `${a.composition} is now @${now.version}; its baselines were approved at @${a.version} and are stale until a review entry accepts @${now.version} (then set its version here)`,
        );
      for (const scheme of BASELINE_SCHEMES) {
        const file = baselineFile(a.composition, shot.key, scheme);
        expected.set(file, a);
        if (!files.includes(file)) problems.push(`${a.composition}: the approved image ${file} is missing`);
        if (!accepting.some((e) => e.approves.includes(file))) problems.push(`${a.composition}: no accepted review entry behind it names ${file}`);
      }
    }
  }
  for (const file of files) if (!expected.has(file)) problems.push(`${file} has no accepted review entry: it isn't a shot in the list`);
  return [...new Set(problems)];
}
