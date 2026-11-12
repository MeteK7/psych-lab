import { Page, expect, test } from '@playwright/test';

import { expectNoSeriousA11yIssues } from './helpers';

// The Visual Lab (development build only): every composition renders in every state with its text
// alternative, and the page passes axe in light, dark and
// forced colours. The screenshot baselines are the ones named by an accepted entry in
// docs/visual-reviews.md (docs/visual-system.md §10): update them only together with such an entry.

const STATES = 4; // mcii.path
const TRANSITIONS = 3; // mcii.path: future → contrast, contrast → plan, contrast → aside
const CAUSE_SETS = 5; // cs2.cause-map: the answer sets in the Lab
const ROUND_SETS = 3; // state-reset.rounds: first, middle, last
const TRACKING_SETS = 3; // state-reset.tracking: outside, inside, the preview
const GENERATOR_SETS = 21; // S2: the reference compositions, 2 or 3 per generator
const LAYOUT_SETS = 4; // S2: grid, radial, flow, packing
const MATERIAL_SETS = 5; // S1 (M3): the material set, a grounded lit form, depth, depth with grain, a translucent overlap
const SHEET_SETS = 12; // the review sheet (M3 stage C): lines, type, and materials and depth in each of the five areas
const MOTION_SETS = 2; // S5 (M5): bars whose values change, a set that reflows
const LIVE_SETS = 3; // S6 (M4): a rating scale, a field with two axes and a choice of three, each the control itself
const PANELS =
  (STATES + TRANSITIONS + CAUSE_SETS + ROUND_SETS + TRACKING_SETS + GENERATOR_SETS + LAYOUT_SETS + MATERIAL_SETS + SHEET_SETS + MOTION_SETS) * 2; // light and dark

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
    // Live figures are groups of sliders, named by their text alternative.
    const live = page.locator('app-vis-interactive[role="group"]');
    await expect(live).toHaveCount(LIVE_SETS * 2);
    for (const label of await live.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))) expect(label?.length).toBeGreaterThan(10);
    await expect(page.getByRole('list', { name: 'Validation problems' })).toHaveCount(0);
    // The purpose of every element is explained.
    await expect(page.getByRole('table').first().getByRole('row')).toHaveCount(1 + 11); // mcii.path
    await expect(page.getByRole('table').nth(1).getByRole('row')).toHaveCount(1 + 7); // cs2.cause-map
    await expect(page.getByRole('table').nth(2).getByRole('row')).toHaveCount(1 + 1); // state-reset.rounds
    await expect(page.getByRole('table').nth(3).getByRole('row')).toHaveCount(1 + 4); // state-reset.tracking
    // Every figure draws something.
    for (const count of await page.locator('app-vis-svg svg').evaluateAll((els) => els.map((e) => e.childElementCount))) {
      expect(count).toBeGreaterThan(0);
    }
    // The game's stills are drawn on a canvas: each has painted pixels.
    const painted = await page.locator('app-lab-tracking-still canvas').evaluateAll((els) =>
      (els as HTMLCanvasElement[]).map((c) => {
        const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
        let n = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
        return n;
      }),
    );
    expect(painted).toHaveLength(4);
    for (const n of painted) expect(n).toBeGreaterThan(100);
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
/** Animations in the figures only: the page's own controls (a button's hover colour) aren't the figure moving. */
const figureAnimations = (page: Page) =>
  page.evaluate(
    () => document.getAnimations().filter((a) => ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('app-vis-svg')).length,
  );
const idle = (page: Page) => expect.poll(() => figureAnimations(page), { timeout: 5_000 }).toBe(0);

test('Visual Lab: each transition plays and ends on the approved state', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/lab');
  await page.getByRole('combobox', { name: /^Motion(?! in these figures)/ }).selectOption('full');
  await page.addStyleTag({ content: CAPTURE });
  for (const [from, to] of [['future', 'contrast'], ['contrast', 'plan'], ['contrast', 'aside']]) {
    await page.getByRole('button', { name: `Replay ${from} → ${to}` }).click();
    await expect.poll(() => figureAnimations(page)).toBeGreaterThan(0);
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
    expect(await figureAnimations(page), `${from} → ${to}`).toBe(0);
    expect(await drawing(page, `figure[data-transition="${from}-${to}-light"]`)).toBe(await drawing(page, `figure[data-baseline="mcii.path-${to}-light"]`));
  }
});

// The visual-language review sheet (M3 stage C): every colour shows the value it takes, wrapped
// labels fit their width in the real face (the widths S1 measures with are a little generous), and
// the spacing check lists only the known cases.
test('Visual Lab: the review sheet', async ({ page }) => {
  await page.goto('/lab');
  for (const scheme of ['light', 'dark']) {
    const values = page.locator(`[data-sheet="roles-${scheme}"] .value`);
    await expect(values).toHaveCount(21 * 5);
    // Read from the surface once it has rendered: every colour names its value.
    await expect.poll(async () => (await values.allInnerTexts()).filter((v) => !v.trim()).length, { message: scheme }).toBe(0);
    // The ramps: six ranges of eleven steps, the area ranges' 500 not used.
    await expect(page.locator(`[data-sheet="ramps-${scheme}"] .chip`)).toHaveCount(66);
    await expect(page.locator(`[data-sheet="ramps-${scheme}"] .chip.unused`)).toHaveCount(5);
  }
  // A far plane takes a lighter step in light and a darker one in dark.
  await expect(page.locator('[data-sheet="roles-light"] [data-token="far"] .value').first()).toHaveText('a-050');
  await expect(page.locator('[data-sheet="roles-dark"] [data-token="far"] .value').first()).toHaveText('a-950');

  const wrapped = page.locator('figure[data-sheet="type-light"] text[data-vis-id="wrapped"] tspan');
  await expect(wrapped).toHaveCount(3);
  for (const width of await wrapped.evaluateAll((spans) => spans.map((s) => (s as SVGTextContentElement).getComputedTextLength())))
    expect(width).toBeLessThanOrEqual(200);
  const halo = page.locator('figure[data-sheet="type-light"] text[data-vis-id="halo"]');
  await expect(halo).toHaveCSS('stroke-width', '4px');
  await expect(halo).toHaveCSS('paint-order', 'stroke');

  // Only the type figure's example: every figure in use keeps its labels clear.
  await expect(page.locator('ul[aria-label^="Spacing warnings"]')).toHaveCount(1);
  await expect(page.getByRole('list', { name: 'Spacing warnings: type' })).toContainText("'no-halo'");
  // The preview's long label wraps within the frame.
  await expect(page.locator('figure[data-instrument="state-reset.tracking-preview-light"] text[data-vis-id="label-ring"] tspan')).toHaveCount(2);
});

// Interaction (M4 stage A): the Lab says which target is under the pointer, from the figure's own
// geometry, at the size the figure is drawn, and the value a click there would set.
test('Visual Lab: interaction targets under the pointer', async ({ page }) => {
  await page.goto('/lab');
  const at = async (figure: string, x: number, y: number) => {
    const svg = page.locator(`[data-interaction="${figure}"] app-vis-svg svg`);
    await svg.scrollIntoViewIfNeeded();
    const box = (await svg.boundingBox())!;
    const s = box.width / 480;
    await page.mouse.move(box.x + x * s, box.y + y * s, { steps: 2 });
  };
  await at('rating-light', 240, 44);
  await expect(page.locator('[data-under="rating"]')).toContainText("handle 'mark' (Rating)");
  await at('rating-dark', 400, 50);
  await expect(page.locator('[data-under="rating"]')).toContainText('a click places it at rating 5');
  await at('field-light', 345, 85);
  await expect(page.locator('[data-under="field"]')).toContainText('across 4, up 4');
  await at('choice-light', 390, 60);
  await expect(page.locator('[data-under="choice"]')).toContainText('choice = third');
  await at('choice-light', 165, 60);
  await expect(page.locator('[data-under="choice"]')).toContainText('nothing');
  // The target view can be turned off.
  await expect(page.locator('svg.targets')).toHaveCount(6);
  await page.getByLabel('Show targets').uncheck();
  await expect(page.locator('svg.targets')).toHaveCount(0);
});

// Interaction (M4 stage B): the live references move by dragging, by clicks alone and by the
// keyboard, and report the exercise's values; both panels of a reference share one value.
test('Visual Lab: live figures take a drag, clicks alone and the keyboard', async ({ page }) => {
  await page.goto('/lab');
  const point = async (figure: string, x: number, y: number) => {
    const svg = page.locator(`[data-interaction="${figure}"] app-vis-svg svg`);
    await svg.scrollIntoViewIfNeeded();
    const box = (await svg.boundingBox())!;
    const s = box.width / 480;
    return [box.x + x * s, box.y + y * s] as const;
  };
  const rating = page.locator('[data-value="rating"]');
  const field = page.locator('[data-value="field"]');
  await expect(rating).toContainText('rating 3');

  // Drag the mark from 3 to the end; the dark panel follows the same value.
  await page.mouse.move(...(await point('rating-light', 240, 44)));
  await page.mouse.down();
  await page.mouse.move(...(await point('rating-light', 330, 44)), { steps: 4 });
  await expect(rating).toContainText('rating 4');
  await page.mouse.move(...(await point('rating-light', 470, 44)), { steps: 4 });
  await page.mouse.up();
  await expect(rating).toContainText('rating 5');
  await expect(page.locator('[data-interaction="rating-dark"] [role="slider"]')).toHaveAttribute('aria-valuenow', '5');

  // Escape during a drag puts the value back.
  await page.mouse.move(...(await point('rating-light', 420, 44)));
  await page.mouse.down();
  await page.mouse.move(...(await point('rating-light', 60, 44)), { steps: 4 });
  await expect(rating).toContainText('rating 1');
  await page.keyboard.press('Escape');
  await expect(rating).toContainText('rating 5');
  await page.mouse.up();
  await expect(rating).toContainText('rating 5');

  // Clicks alone: pick the mark up, then click where it goes (below the line still counts).
  await page.mouse.click(...(await point('rating-dark', 420, 44)));
  await expect(page.locator('[data-interaction="rating-dark"] [data-vis-id="mark"]')).toHaveCSS('stroke-width', '3px');
  await page.mouse.click(...(await point('rating-dark', 150, 90)));
  await expect(rating).toContainText('rating 2');
  // Pressing the track places the mark there at once.
  await page.mouse.click(...(await point('rating-light', 330, 50)));
  await expect(rating).toContainText('rating 4');

  // The keyboard only: Tab through the stops; each axis of the field is its own slider.
  await page.locator('[data-interaction="rating-light"] [role="slider"]').focus();
  await page.keyboard.press('Home');
  await expect(rating).toContainText('rating 1');
  await expect(page.locator('[data-interaction="rating-light"] [data-vis-id="mark-focus"]')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('slider', { name: 'Place, across' }).first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(field).toContainText('across 3, up 4');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(field).toContainText('across 3, up 5');
  await page.keyboard.press('Home');
  await expect(field).toContainText('across 3, up 1');
  await expect(page.locator('[data-interaction="field-light"] [data-vis-id="mark-focus"]')).toHaveCount(1);
  // The ring follows focus: it left the rating when focus did.
  await expect(page.locator('[data-vis-id="mark-focus"]')).toHaveCount(1);

  // The options are one radio group: Tab reaches the chosen one, the arrows move and choose.
  const choice = page.locator('[data-value="choice"]');
  await page.locator('[data-interaction="choice-light"] [role="radio"][aria-checked="true"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(choice).toContainText('choice third');
  await expect(page.getByRole('radio', { name: 'Third' }).first()).toBeFocused();
  await expect(page.locator('[data-interaction="choice-light"] [data-vis-id="third-focus"]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect(choice).toContainText('choice first');
  // A click chooses an option as a whole.
  await page.mouse.click(...(await point('choice-dark', 240, 60)));
  await expect(choice).toContainText('choice second');
  await expect(page.locator('[data-interaction="choice-light"] [role="radio"][aria-checked="true"]')).toHaveAttribute('aria-label', 'Second');
});

// Native controls beside the figures (M4 stage C): they hold the same values; the figures take the
// pointer only and are pictures to assistive technology.
test('Visual Lab: native controls hold the same values as the figures', async ({ page }) => {
  await page.goto('/lab');
  await page.getByLabel('Keyboard and screen readers use').selectOption('native');
  await expect(page.locator('app-vis-interactive[role="group"]')).toHaveCount(0);
  await expect(page.locator('app-vis-interactive[role="img"]')).toHaveCount(LIVE_SETS * 2);
  await expect(page.locator('app-vis-interactive [role="slider"], app-vis-interactive [role="radio"]')).toHaveCount(0);

  const rating = page.getByRole('slider', { name: 'Rating' });
  await rating.focus();
  await page.keyboard.press('End');
  await expect(page.locator('[data-value="rating"]')).toContainText('rating 5');
  await expect(page.locator('[data-interaction="rating-light"] [data-vis-id="mark"]')).toHaveAttribute('d', /^M409 44/);
  await page.getByRole('slider', { name: 'Place, up' }).fill('1');
  await expect(page.locator('[data-value="field"]')).toContainText('across 2, up 1');
  await page.getByRole('radio', { name: 'Third' }).check();
  await expect(page.locator('[data-value="choice"]')).toContainText('choice third');

  // The pointer still works on the figure, and the native control follows it.
  const svg = page.locator('[data-interaction="rating-light"] app-vis-svg svg');
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  await page.mouse.click(box.x + (150 * box.width) / 480, box.y + (50 * box.width) / 480);
  await expect(rating).toHaveValue('2');
  await expectNoSeriousA11yIssues(page, 'Visual Lab, native controls');
});

// Forced colours (M4 stage C): the focus ring and a handle being moved take the system highlight.
test('Visual Lab: focus and movement show in forced colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/lab');
  const highlight = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.color = 'Highlight';
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  });
  await page.locator('[data-interaction="choice-light"] [role="radio"][aria-checked="true"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-interaction="choice-light"] [data-vis-id="third-focus"]')).toHaveCSS('stroke', highlight);
  await page.locator('[data-interaction="rating-dark"] [role="slider"]').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('[data-interaction="rating-dark"] [data-vis-id="mark-focus"]')).toHaveCSS('stroke', highlight);
  // Picked up by a click, the mark is drawn in the highlight colour, one weight heavier.
  const svg = page.locator('[data-interaction="rating-light"] app-vis-svg svg');
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  await page.mouse.click(box.x + (60 * box.width) / 480, box.y + (44 * box.width) / 480);
  const mark = page.locator('[data-interaction="rating-light"] [data-vis-id="mark"]');
  await expect(mark).toHaveCSS('stroke', highlight);
  await expect(mark).toHaveCSS('stroke-width', '3px');
});

// Motion between values (M5 stage A): a figure drawn again from new data glides there, and ends
// on the new figure; with reduced motion, the new figure shows at once.
test('Visual Lab: figures built from data glide to their new values', async ({ page }) => {
  await page.goto('/lab');
  const section = page.locator('section[aria-labelledby="lab-motion"]');
  await section.scrollIntoViewIfNeeded();
  await section.getByLabel('Motion in these figures').selectOption('full');
  const bar = page.locator('[data-motion="bars-light"] [data-vis-id="bar-1"]');
  const before = await bar.getAttribute('d');
  // Record the drawings the bar passes through, frame by frame, until the glide ends.
  const seen = page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const el = document.querySelector('[data-motion="bars-light"] [data-vis-id="bar-1"]')!;
        const seen: string[] = [];
        const start = performance.now();
        const look = () => {
          seen.push(el.getAttribute('d')!);
          if (performance.now() - start < 700) requestAnimationFrame(look);
          else resolve(seen);
        };
        requestAnimationFrame(look);
      }),
  );
  await page.getByRole('button', { name: 'New values' }).click();
  const drawings = [...new Set(await seen)];
  const after = await bar.getAttribute('d');
  expect(after).not.toBe(before);
  // Several drawings between the two, and it ends on the new one.
  expect(drawings.filter((d) => d !== before && d !== after).length).toBeGreaterThan(3);
  expect(drawings[drawings.length - 1]).toBe(after);
  await expect(page.locator('[data-moved="bars"]')).toContainText('glides to its new place and shape (300 ms)');

  // Reduced motion: the new drawing at once.
  await section.getByLabel('Motion in these figures').selectOption('reduced');
  const shown = await bar.getAttribute('d');
  await page.getByRole('button', { name: 'New values' }).click();
  // The first new drawing is the last: nothing in between.
  await expect(bar).not.toHaveAttribute('d', shown!);
  const next = await bar.getAttribute('d');
  await page.waitForTimeout(400);
  expect(await bar.getAttribute('d')).toBe(next);
  expect(next).toBe(await page.locator('[data-motion="bars-dark"] [data-vis-id="bar-1"]').getAttribute('d'));

  // A set that reflows: the new member enters; no copies are left behind.
  await section.getByLabel('Motion in these figures').selectOption('full');
  await page.getByRole('button', { name: 'Add a member' }).click();
  await expect(page.locator('[data-motion="set-light"] [data-vis-id="member-6"]')).toHaveCount(1);
  await expect(page.locator('[data-motion="set-light"] [data-vis-ghost]')).toHaveCount(0);
  await expect(page.locator('[data-moved="set"]')).toContainText('member-6 fades in');
});
