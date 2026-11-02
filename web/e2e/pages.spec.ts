import { expect, test } from '@playwright/test';

import { expectNoSeriousA11yIssues } from './helpers';

// Every page, and every exercise's start page with its science explanation open, passes
// an axe scan for WCAG 2.2 AA (plan §8).

const PAGES = [
  ['/', 'Home'],
  ['/areas/action-growth', 'Action and growth'],
  ['/experiment', 'My experiment'],
  ['/records', 'My records'],
  ['/about', 'About'],
] as const;

const CONDITIONS = [
  'action_bridge',
  'goal_restatement',
  'state_reset+action_bridge',
  'game_only+action_bridge',
];

for (const [path, heading] of PAGES) {
  test(`${heading} page`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yIssues(page, path);
  });
}

for (const condition of CONDITIONS) {
  test(`start page with "Why this exercise?" open: ${condition}`, async ({ page }) => {
    await page.goto(`/session?mode=try&condition=${encodeURIComponent(condition)}&why=1`);
    const details = page.locator('app-science-section details');
    await expect(details).toHaveAttribute('open', '');
    await expectNoSeriousA11yIssues(page, condition);
  });
}

test('the scan itself catches a serious problem', async ({ page }) => {
  // Guards against a silently passing check: a form field with no label must fail.
  await page.goto('/about');
  await page.evaluate(() =>
    document.querySelector('main')!.append(document.createElement('input')),
  );
  await expect(expectNoSeriousA11yIssues(page, 'planted problem')).rejects.toThrow(/label/);
});

test('dark colour scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/session?mode=try&condition=action_bridge&why=1');
  await expectNoSeriousA11yIssues(page, 'dark: start page');
  await page.goto('/areas/action-growth');
  await expectNoSeriousA11yIssues(page, 'dark: area page');
});
