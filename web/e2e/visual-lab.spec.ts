import { Page, expect, test } from '@playwright/test';

import { expectNoSeriousA11yIssues } from './helpers';

// The Visual Lab (development build only): every composition renders in every state with its text
// alternative, and the page passes axe in light, dark and
// forced colours. The screenshot baselines are the ones named by an accepted entry in
// docs/visual-reviews.md (docs/visual-system.md §10): update them only together with such an entry.

const STATES = 4; // mcii.path
const TRANSITIONS = 3; // mcii.path: future → contrast, contrast → plan, contrast → aside
const CAUSE_SETS = 5; // cs2.cause-map: the answer sets in the Lab
const PANELS = (STATES + TRANSITIONS + CAUSE_SETS) * 2; // light and dark

for (const [name, media] of [
  ['light', { colorScheme: 'light' }],
  ['dark', { colorScheme: 'dark' }],
  ['forced colours', { forcedColors: 'active' }],
] as const) {
  test(`Visual Lab: every composition, ${name}`, async ({ page }) => {
    await page.emulateMedia(media);
    await page.goto('/lab');
    await expect(page.getByRole('heading', { level: 1, name: 'Visual Lab' })).toBeVisible();
    const figures = page.locator('figure[role="img"]');
    await expect(figures).toHaveCount(PANELS);
    for (const label of await figures.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))) {
      expect(label?.length).toBeGreaterThan(10);
    }
    await expect(page.getByRole('list', { name: 'Validation problems' })).toHaveCount(0);
    // The purpose of every element is explained.
    await expect(page.getByRole('table').first().getByRole('row')).toHaveCount(1 + 11); // mcii.path
    await expect(page.getByRole('table').nth(1).getByRole('row')).toHaveCount(1 + 7); // cs2.cause-map
    // Every figure draws something.
    for (const count of await page.locator('app-vis-svg svg').evaluateAll((els) => els.map((e) => e.childElementCount))) {
      expect(count).toBeGreaterThan(0);
    }
    await expectNoSeriousA11yIssues(page, `Visual Lab, ${name}`);
  });
}

// Approved baselines (docs/visual-reviews.md, entries 1–3): every state of each accepted scene
// and every answer set of each accepted instrument, light and dark, and in forced colours. Each
// figure is captured on its own fixed surface, 480 px wide (the scene's design width) at the
// page's top left, so the Lab's layout can change without moving a single pixel of the capture.
const BASELINES = [
  { id: 'mcii.path', attribute: 'data-baseline', keys: ['future', 'contrast', 'plan', 'aside'] }, // entry 1
  { id: 'cs2.cause-map', attribute: 'data-instrument', keys: ['start', 'placing', 'spread', 'heavy', 'six'] }, // entry 3
];
const CAPTURE = `.capture { position: fixed !important; left: 0; top: 0; width: 480px; margin: 0;
  z-index: 2147483647; background: var(--bg); }`;

async function capture(page: Page, figure: string, file: string, options: { maxDiffPixels?: number } = {}) {
  const locator = page.locator(figure);
  await locator.evaluate((el) => el.classList.add('capture'));
  await expect(locator).toHaveScreenshot(file, { animations: 'disabled', ...options });
  await locator.evaluate((el) => el.classList.remove('capture'));
}

for (const [name, media, schemes] of [
  ['light and dark', { colorScheme: 'light' }, ['light', 'dark']],
  ['forced colours', { forcedColors: 'active' }, ['light']],
] as const) {
  test(`Visual Lab: approved baselines, ${name}`, async ({ page }) => {
    await page.emulateMedia(media);
    await page.goto('/lab');
    await page.addStyleTag({ content: CAPTURE });
    for (const { id: composition, attribute, keys } of BASELINES)
      for (const key of keys)
        for (const scheme of schemes) {
          const id = `${composition}-${key}-${scheme}`;
          const file = media.forcedColors ? `${composition}-${key}-forced.png` : `${id}.png`;
          await capture(page, `figure[${attribute}="${id}"]`, file);
        }
  });
}

// Motion (MCII step 4c): a transition plays and ends on the approved state, and under reduced
// motion nothing moves. The end state is compared with the approved state's drawing as markup,
// and the bridge, which is drawn through a mask, also as pixels.
const drawing = (page: Page, figure: string) =>
  page
    .locator(`${figure} svg`)
    .evaluate((svg) => svg.outerHTML.replace(/<defs[^>]*>.*?<\/defs>/s, '').replace(/ mask="[^"]*"/g, ''));
const idle = (page: Page) => expect.poll(() => page.evaluate(() => document.getAnimations().length), { timeout: 5_000 }).toBe(0);

test('Visual Lab: each transition plays and ends on the approved state', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/lab');
  await page.getByLabel('Motion').selectOption('full');
  await page.addStyleTag({ content: CAPTURE });
  for (const [from, to] of [['future', 'contrast'], ['contrast', 'plan'], ['contrast', 'aside']]) {
    await page.getByRole('button', { name: `Replay ${from} → ${to}` }).click();
    await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
    await idle(page);
    for (const scheme of ['light', 'dark'])
      expect(await drawing(page, `figure[data-transition="${from}-${to}-${scheme}"]`), `${from} → ${to}, ${scheme}`).toBe(
        await drawing(page, `figure[data-baseline="mcii.path-${to}-${scheme}"]`),
      );
  }
  // The bridge is fully drawn at the end, pixel for pixel.
  await capture(page, 'figure[data-transition="contrast-plan-light"]', 'mcii.path-plan-light.png');
});

test('Visual Lab: nothing moves under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lab');
  await expect(page.locator('figure[data-transition]')).toHaveCount(TRANSITIONS * 2);
  for (const [from, to] of [['future', 'contrast'], ['contrast', 'plan'], ['contrast', 'aside']]) {
    await page.getByRole('button', { name: `Replay ${from} → ${to}` }).click();
    expect(await page.evaluate(() => document.getAnimations().length), `${from} → ${to}`).toBe(0);
    expect(await drawing(page, `figure[data-transition="${from}-${to}-light"]`)).toBe(await drawing(page, `figure[data-baseline="mcii.path-${to}-light"]`));
  }
});
