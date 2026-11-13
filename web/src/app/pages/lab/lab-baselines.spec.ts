import { listSources, readSource } from '../../shared/visual/testing/source-files';
import { ACCEPTED, AcceptedComposition, ReviewEntry, baselineFile, baselineProblems, parseReviews } from './lab-baselines';
import { parityCases } from './lab-parity-cases';

// The screenshot baselines (M8 stage B): the list of accepted compositions, the review log and the
// snapshot folder stay in step (docs/visual-system.md §10). The browser tests compare the images;
// this keeps every image tied to the review that approved it.

const FOLDER = 'e2e/visual-lab.spec.ts-snapshots';

async function actual() {
  const reviews = parseReviews(await readSource('../docs/visual-reviews.md'));
  const files = (await listSources(FOLDER)).map((p) => p.slice(FOLDER.length + 1));
  const cases = new Map(parityCases().map((c) => [c.key, c.source]));
  const drawn = (key: string) => {
    const source = cases.get(key);
    return source ? { id: source.id, version: source.version } : undefined;
  };
  return { reviews, files, drawn };
}

describe('the screenshot baselines (M8)', () => {
  it('every image has an accepted review entry, every entry its images, and none is stale', async () => {
    const { reviews, files, drawn } = await actual();
    expect(baselineProblems(ACCEPTED, reviews, files, drawn)).toEqual([]);
    // The 27 approved images: 4 states of mcii.path and 5 answer sets of the cause map, in three schemes.
    expect(files).toHaveLength(27);
  });

  it('reads the review log', async () => {
    const { reviews } = await actual();
    expect(reviews.slice(0, 3).map((r) => [r.number, r.item, r.accepted, r.approves.length])).toEqual([
      [1, 'mcii.path@3', true, 12],
      [2, 'mcii.path@4', true, 0],
      [3, 'cs2.cause-map@1', true, 15],
    ]);
  });

  describe('each guard fails when it should', () => {
    const mcii = ACCEPTED.find((a) => a.composition === 'mcii.path')!;
    const only = [mcii];
    const problems = async (change: { accepted?: AcceptedComposition[]; reviews?: (r: ReviewEntry[]) => ReviewEntry[]; files?: (f: string[]) => string[]; version?: number }) => {
      const { reviews, files, drawn } = await actual();
      const mine = files.filter((f) => f.startsWith('mcii-path-'));
      return baselineProblems(
        change.accepted ?? only,
        (change.reviews ?? ((r) => r))(reviews),
        (change.files ?? ((f) => f))(mine),
        (key) => {
          const now = drawn(key);
          return now && change.version ? { ...now, version: change.version } : now;
        },
      );
    };

    it('in step, the mcii.path images alone have no problems', async () => {
      expect(await problems({})).toEqual([]);
    });

    it('1. an image no review approved', async () => {
      expect(await problems({ files: (f) => [...f, 'mcii-path-extra-light-win32.png'] })).toEqual([
        "mcii-path-extra-light-win32.png has no accepted review entry: it isn't a shot in the list",
      ]);
    });

    it('1. an entry whose verdict isn’t Accept', async () => {
      const rejected = (r: ReviewEntry[]) => r.map((e) => (e.number === 1 ? { ...e, accepted: false } : e));
      const found = await problems({ reviews: rejected });
      expect(found).toContain("mcii.path: review entry 1 doesn't accept it (its verdict isn't Accept)");
      expect(found).toContain(`mcii.path: no accepted review entry behind it names ${baselineFile('mcii.path', 'future', 'light')}`);
    });

    it('1. an entry that isn’t there', async () => {
      expect(await problems({ accepted: [{ ...mcii, entries: [1, 2, 9] }] })).toEqual(['mcii.path: there is no review entry 9']);
    });

    it('2. an approved image missing', async () => {
      const gone = baselineFile('mcii.path', 'plan', 'forced');
      expect(await problems({ files: (f) => f.filter((x) => x !== gone) })).toEqual([`mcii.path: the approved image ${gone} is missing`]);
    });

    it('3. a version bump makes the images stale', async () => {
      expect(await problems({ version: 5 })).toEqual([
        'mcii.path is now @5; its baselines were approved at @4 and are stale until a review entry accepts @5 (then set its version here)',
      ]);
    });

    it('3. raising the list’s version without a review entry for it', async () => {
      expect(await problems({ accepted: [{ ...mcii, version: 5 }], version: 5 })).toEqual(['mcii.path: no accepted review entry names mcii.path@5']);
    });

    it('a shot whose parity case doesn’t exist', async () => {
      expect(await problems({ accepted: [{ ...mcii, shots: [...mcii.shots.slice(0, 3), { key: 'aside', case: 'mcii.path.gone' }] }] })).toEqual([
        "mcii.path: there is no parity case 'mcii.path.gone'",
      ]);
    });
  });
});
