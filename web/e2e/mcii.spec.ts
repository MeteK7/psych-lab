import { Page, expect, test } from '@playwright/test';

import {
  beginExercise,
  expectNoSeriousA11yIssues,
  pressButton,
  rateByKeyboard,
  savedSession,
  tabTo,
  typeInto,
} from './helpers';

// The MCII exercise (development build only), completed with the keyboard alone, with an axe scan
// on every screen. Anything typed is marked PRIVATE and must never be saved.

async function choose(page: Page, first: ReturnType<Page['locator']>, arrows = 0): Promise<void> {
  await tabTo(page, first);
  await page.keyboard.press('Space');
  for (let i = 0; i < arrows; i++) await page.keyboard.press('ArrowRight');
}

async function step(page: Page, title: string): Promise<void> {
  await expect(page.locator('h2.progress')).toContainText(title);
  await expectNoSeriousA11yIssues(page, title);
}

async function throughObstacle(page: Page): Promise<string> {
  await page.goto('/session?mode=try&condition=mcii');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoSeriousA11yIssues(page, 'preview');
  const id = await beginExercise(page);

  await step(page, 'Your wish');
  await typeInto(page, /My wish, in a few words/, 'PRIVATE wish');
  await choose(page, page.getByRole('radio', { name: 'Learning' }), 1); // → Work
  await expect(page.getByRole('radio', { name: 'Work', exact: true })).toBeChecked();
  await rateByKeyboard(page, 'How much does this matter to you?', 8);
  await rateByKeyboard(page, 'How likely do you think it is that your wish will come true?', 6);
  await pressButton(page, 'Next');

  await step(page, 'The best part');
  await expect(page.getByText('Your wish: “PRIVATE wish”')).toBeVisible();
  await typeInto(page, /The best part, in a few words/, 'PRIVATE outcome');
  await pressButton(page, 'Done');
  await expect(page.getByRole('status')).toContainText('Now picture it.');
  await expectNoSeriousA11yIssues(page, 'picture the best part');
  await pressButton(page, 'Next');

  await step(page, "What's in the way");
  await expect(page.getByText('The best part: “PRIVATE outcome”')).toBeVisible();
  await choose(page, page.getByRole('radio').first(), 2); // the third card
  await expect(page.getByRole('radio', { name: 'I avoid it when it feels hard.' })).toBeChecked();
  await pressButton(page, 'Done');
  await expect(page.getByRole('status')).toContainText('Now picture the moment it happens.');
  await expectNoSeriousA11yIssues(page, 'picture the obstacle');
  await pressButton(page, 'Next');
  return id;
}

test.describe('MCII, keyboard only', () => {
  test('keeps the wish and makes a plan', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const id = await throughObstacle(page);

    await step(page, 'Look at both');
    await expect(page.getByRole('img', { name: /with a low wall across it\.$/ })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0); // no comparison before rating
    await rateByKeyboard(page, "Now that you've looked at both, how likely do you think it is that your wish will come true?", 3);
    await expect(page.getByRole('status')).toContainText('Earlier you said 6, and now you say 3.');
    await choose(page, page.getByRole('radio', { name: /Keep it/ }));
    await expectNoSeriousA11yIssues(page, 'decided');
    await pressButton(page, 'Next');

    await step(page, "What you'll do");
    await expect(page.getByRole('img', { name: /dashed bridge/ })).toBeVisible();
    await expect(page.getByLabel(/^If…/)).toHaveValue('it starts to feel hard');
    await choose(page, page.getByRole('radio').first()); // the first response
    await pressButton(page, 'Done');
    await expect(page.getByRole('status')).toContainText(
      'Your plan: If it starts to feel hard, then I will start with just five minutes.',
    );
    await expectNoSeriousA11yIssues(page, 'plan read back');
    await pressButton(page, 'Next');

    await step(page, 'Keeping it');
    await pressButton(page, 'Copy my plan');
    await expect(page.getByText('Copied.')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('My wish: PRIVATE wish');
    await rateByKeyboard(page, 'How ready do you feel to act on your plan?', 7);
    await choose(page, page.getByRole('radio', { name: 'More encouraged' }), 2); // → More discouraged
    await expect(page.getByText('can feel discouraging')).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'discouraged');
    await pressButton(page, 'Finish');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'done');

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    const saved = await savedSession(page, id);
    // Try it keeps only that it ran, and which picture was drawn (M1); the choices and
    // ratings are checked in mcii-exercise.spec.ts.
    expect(saved.ratings).toBeNull();
    expect(saved.steps.map((s) => s.result)).toEqual([
      { visual_source: expect.stringMatching(/^scene:mcii\.path@\d+;theme:action@\d+$/) },
      {},
      {},
      {},
      {},
      {},
    ]);
    expect(JSON.stringify(saved)).not.toContain('PRIVATE');
  });

  test('sets the wish aside', async ({ page }) => {
    const id = await throughObstacle(page);
    await step(page, 'Look at both');
    await rateByKeyboard(page, "Now that you've looked at both, how likely do you think it is that your wish will come true?", 1);
    await choose(page, page.getByRole('radio', { name: /Keep it/ }), 2); // → Set it aside
    await expect(page.getByRole('radio', { name: /Set it aside/ })).toBeChecked();
    await pressButton(page, 'Next');

    await step(page, "What you'll do");
    await expect(page.getByText("You've set this wish aside. That's a real decision too.")).toBeVisible();
    await pressButton(page, 'Next');

    await step(page, 'Keeping it');
    await expect(page.getByRole('button', { name: 'Copy my plan' })).toHaveCount(0);
    await choose(page, page.getByRole('radio', { name: 'More encouraged' }), 1); // → About the same
    await pressButton(page, 'Finish');
    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    expect(JSON.stringify(await savedSession(page, id))).not.toContain('PRIVATE');
  });

  test('changes the wish', async ({ page }) => {
    const id = await throughObstacle(page);
    await step(page, 'Look at both');
    await rateByKeyboard(page, "Now that you've looked at both, how likely do you think it is that your wish will come true?", 4);
    await choose(page, page.getByRole('radio', { name: /Keep it/ }), 1); // → Change it
    await expectNoSeriousA11yIssues(page, 'change it open');
    await typeInto(page, /My wish now/, 'PRIVATE smaller wish');
    await pressButton(page, 'Next');
    await step(page, "What you'll do");
    await expect(page.getByText('Your wish: “PRIVATE smaller wish”')).toBeVisible();
    await expect.poll(async () => (await savedSession(page, id)).steps.length).toBe(4);
    expect(JSON.stringify(await savedSession(page, id))).not.toContain('PRIVATE');
  });
});

test.describe('MCII card and explanation', () => {
  test('appears in its own topic and passes the scan, also in dark mode', async ({ page }) => {
    await page.goto('/areas/action-growth');
    await expect(page.getByRole('heading', { name: 'Choosing what to go after' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Your wish, and what's in the way" })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'area page');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoSeriousA11yIssues(page, 'area page, dark');
  });

  test('the explanation keeps the evidence tracks apart and credits WOOP', async ({ page }) => {
    await page.goto('/session?mode=try&condition=mcii&why=1');
    const why = page.locator('app-science-section details');
    await expect(why.getByText('Mental contrasting alone:')).toBeVisible();
    await expect(why.getByText('If-then plans alone:')).toBeVisible();
    await expect(why.getByText('The two together:')).toBeVisible();
    await expect(why.getByText(/known as WOOP/)).toBeVisible();
    await expect(why.getByText(/path picture is only an illustration/)).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'explanation');
  });

  test('every step passes the scan in dark mode too', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await throughObstacle(page);
    await step(page, 'Look at both');
  });
});
