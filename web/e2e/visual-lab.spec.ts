import { expect, test } from '@playwright/test';

import { expectNoSeriousA11yIssues } from './helpers';

// The Visual Lab (development build only): every composition renders in every state with its text
// alternative, next to the picture it would replace, and the page passes axe in light, dark and
// forced colours. Screenshot baselines are added with the first accepted review
// (docs/visual-system.md §10), never before.

const STATES = 4; // mcii.path
const PANELS = STATES * 2 * 2; // original and revised, light and dark

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
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + 11);
    // Every figure draws something.
    for (const count of await page.locator('app-vis-svg svg').evaluateAll((els) => els.map((e) => e.childElementCount))) {
      expect(count).toBeGreaterThan(0);
    }
    await expectNoSeriousA11yIssues(page, `Visual Lab, ${name}`);
  });
}
