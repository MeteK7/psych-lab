import { execFileSync } from 'node:child_process';

import { Page, expect, test } from '@playwright/test';

import { expectNoSeriousA11yIssues, pressButton, rateByKeyboard, typeInto } from '../e2e/helpers';

// The booth profile (M1, docs/product-model.md §3, §6): only exercises rated safe for unsupervised
// use, no records, no experiment, a support line on screen, and nothing from one visitor left for
// the next, after "Done" or after the idle reset. The API runs with one exercise rated safe for
// these tests only ("Write down your goal"); see api/app/e2e_server.py --booth.
//
// Shares the test database with the main browser tests: run the two suites one after the other.

const UNPLEASANT = 'Right now, how unpleasant does starting it feel?';

/** Rows in the test database that hold anything a visitor wrote or chose. */
function storedAnswers(): string {
  const script = [
    'from sqlalchemy import create_engine, text',
    'from app.config import get_settings',
    'engine = create_engine(get_settings().test_database_url)',
    'with engine.connect() as c:',
    '    rows = c.execute(text("SELECT mode, plan, ratings, followup, steps::text FROM sessions")).all()',
    'print(len(rows), sum(1 for r in rows if r[1] is not None or r[2] or r[3] is not None or "PRIVATE" in r[4]))',
  ].join('\n');
  return execFileSync('uv', ['run', 'python', '-c', script], {
    cwd: '../api',
    env: { ...process.env, UV_PYTHON_DOWNLOADS: 'never' },
    encoding: 'utf-8',
  }).trim();
}

/** Starts "Write down your goal" from its area page and writes a private goal. */
async function startGoal(page: Page, goal: string): Promise<void> {
  await page.goto('/areas/action-growth');
  await page.getByRole('button', { name: 'Try it' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Write down your goal' })).toBeVisible();
  await page.getByRole('button', { name: 'Begin' }).click();
  await rateByKeyboard(page, UNPLEASANT, 5);
  await pressButton(page, 'Continue');
  await typeInto(page, 'What is your goal?', goal);
  await typeInto(page, 'What will you work on today?', 'PRIVATE topic');
}

async function nothingLeft(page: Page, words: string): Promise<void> {
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.content()).not.toContain(words);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  // Back never returns to the visit.
  await page.goBack();
  expect(await page.content()).not.toContain(words);
}

test('offers only the rated exercise, with the support line, and no records or experiment', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('note')).toHaveText('Test support line: 0000');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText(['Home']);
  await expectNoSeriousA11yIssues(page, 'booth: home');

  await page.goto('/areas/action-growth');
  await expect(page.getByRole('button', { name: 'Try it' })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 3, name: 'Write down your goal' })).toBeVisible();
  await expect(page.getByText('Open My experiment')).toHaveCount(0);
  await expect(page.getByText('Nothing you write or choose is saved here.').first()).toBeVisible();

  for (const path of ['/records', '/experiment', '/lab', '/session?mode=try&condition=action_bridge']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: 'Not available here' }), path).toBeVisible();
  }
  expect((await page.request.get('/api/sessions')).status()).toBe(403);
  expect((await page.request.get('/api/n1/today')).status()).toBe(403);
});

test('leaves nothing for the next visitor after "Done"', async ({ page }) => {
  await startGoal(page, 'PRIVATE goal one');
  await pressButton(page, 'Continue');
  await page.getByLabel("I've read them twice").check();
  await pressButton(page, 'Continue');
  await rateByKeyboard(page, UNPLEASANT, 4);
  await pressButton(page, 'Continue');

  await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Take it with you' })).toBeVisible();
  await expect(page.locator('.kept')).toHaveText('PRIVATE goal one');
  await expect(page.getByRole('link', { name: 'My records' })).toHaveCount(0);
  await expectNoSeriousA11yIssues(page, 'booth: done screen');

  await page.getByRole('button', { name: 'Done' }).click();
  await nothingLeft(page, 'PRIVATE goal one');
  const [rows, withAnswers] = storedAnswers().split(' ').map(Number);
  expect(rows).toBeGreaterThan(0); // the run is still recorded, for the exposure analysis
  expect(withAnswers).toBe(0);
});

test('ends an idle visit and leaves nothing of it', async ({ page }) => {
  await page.clock.install();
  await startGoal(page, 'PRIVATE goal two');
  await page.clock.runFor(30_000); // BOOTH_IDLE_SECONDS in the test server
  await expect(page.getByRole('alertdialog', { name: 'Still there?' })).toBeVisible();
  await expect(page.getByRole('button', { name: "I'm still here" })).toBeFocused();
  await expectNoSeriousA11yIssues(page, 'booth: idle notice');
  await page.clock.runFor(31_000);
  await nothingLeft(page, 'PRIVATE goal two');
  expect(storedAnswers().split(' ')[1]).toBe('0');
});
