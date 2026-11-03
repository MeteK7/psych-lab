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

// The Cognitive shifts exercises (development build only), completed with the keyboard alone,
// with an axe scan on every screen. Anything typed is marked PRIVATE and must never be saved.

async function open(page: Page, exercise: string): Promise<string> {
  await page.goto(`/session?mode=try&condition=${exercise}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoSeriousA11yIssues(page, `${exercise}: preview`);
  return beginExercise(page);
}

/**
 * Tab into a radio group (or to a checkbox) and select it with Space; arrow keys then move
 * to later options in the group, as a keyboard user would.
 */
async function choose(page: Page, first: ReturnType<Page['locator']>, arrows = 0): Promise<void> {
  await tabTo(page, first);
  await page.keyboard.press('Space');
  for (let i = 0; i < arrows; i++) await page.keyboard.press('ArrowRight');
}

async function step(page: Page, title: string): Promise<void> {
  await expect(page.locator('h2.progress')).toContainText(title);
  await expectNoSeriousA11yIssues(page, title);
}

test.describe('Cognitive shifts, keyboard only', () => {
  test('Other ways to read it', async ({ page }) => {
    const id = await open(page, 'cs_other_readings');
    await step(page, 'Your first reading');
    await choose(page, page.getByRole('radio').first(), 4); // → "My own reading", after the 4 cards
    await expect(page.getByRole('radio', { name: 'My own reading' })).toBeChecked();
    await expectNoSeriousA11yIssues(page, 'own reading open');
    await typeInto(page, /Write it in a few words/, 'PRIVATE first reading');
    await pressButton(page, 'Next');

    await step(page, 'How it feels now');
    await rateByKeyboard(page, 'How much do you believe this reading right now?', 7);
    await rateByKeyboard(page, 'How upsetting does it feel right now?', 6);
    await choose(page, page.getByRole('radio', { name: 'Yes', exact: true }));
    await pressButton(page, 'Next');

    await step(page, 'Other ways to see it');
    await choose(page, page.getByRole('radio', { name: 'It was harder than it looked.' }));
    await pressButton(page, 'Next lens');
    await expect(page.getByText("Lens 2 of 3: A friend's view")).toBeFocused();
    await expectNoSeriousA11yIssues(page, 'lens 2');
    await pressButton(page, 'Nothing comes to mind');
    await choose(page, page.getByRole('radio').first(), 4); // → "My own reading"
    await typeInto(page, /Write it in a few words/, 'PRIVATE lens reading');
    await pressButton(page, 'Next');

    await step(page, 'Which readings fit?');
    await choose(page, page.locator('#place-first-fits'));
    await expect(page.locator('#place-first-fits')).toBeFocused(); // focus follows the moved card
    await choose(page, page.locator('#place-explain-fits'), 1); // → Partly fits
    await choose(page, page.locator('#place-later-fits'));
    await expectNoSeriousA11yIssues(page, 'board filled');
    await pressButton(page, 'Next');

    await step(page, 'How it feels now');
    await rateByKeyboard(page, 'How much do you believe this reading right now?', 4);
    await rateByKeyboard(page, 'How upsetting does it feel right now?', 3);
    await pressButton(page, 'Next');

    await step(page, "What you're keeping");
    await expect(page.getByText('It still feels like it fits.')).toBeVisible();
    await pressButton(page, 'Finish');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Plan your first step' })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'done');

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    expect(JSON.stringify(await savedSession(page, id))).not.toContain('PRIVATE');
  });

  test('Why did it happen?', async ({ page }) => {
    const id = await open(page, 'cs_why_it_happened');
    await step(page, 'The setback');
    await typeInto(page, /In a few words/, 'PRIVATE setback');
    await pressButton(page, 'Next');

    await step(page, 'Why do you think it happened?');
    await choose(page, page.getByRole('radio', { name: "I'm just not good at this." }));
    await pressButton(page, 'Next');

    await step(page, 'Other possible causes');
    await choose(page, page.getByRole('checkbox', { name: 'How much time I had' }));
    await typeInto(page, 'Write a cause', 'PRIVATE cause');
    await page.keyboard.press('Enter'); // adds it
    await expect(page.getByText('3 causes so far.')).toBeVisible();
    await pressButton(page, 'Next');

    await step(page, 'Place each cause');
    const first = page.getByRole('slider').first();
    await tabTo(page, first);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(first).toHaveValue('1');
    await pressButton(page, 'Next cause');
    await expectNoSeriousA11yIssues(page, 'cause 2');
    await pressButton(page, 'Next cause');
    await pressButton(page, 'Next');

    await step(page, 'What the map shows');
    await expect(
      page.getByText("Effort is one possible cause among many. It isn't the answer by default."),
    ).toBeVisible();
    await pressButton(page, 'Next');

    await step(page, 'Anything to change?');
    await choose(page, page.getByRole('radio').first());
    await pressButton(page, 'Finish');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    expect(JSON.stringify(await savedSession(page, id))).not.toContain('PRIVATE');
  });

  test('Not enough to go on', async ({ page }) => {
    const id = await open(page, 'cs_not_enough_to_go_on');
    await step(page, 'An unclear situation');
    await choose(page, page.getByRole('radio').first(), 1); // the second situation
    await expect(page.getByRole('radio', { name: /A friend hasn't replied/ })).toBeChecked();
    await pressButton(page, 'Next');

    await step(page, 'Your first reading');
    await choose(page, page.getByRole('radio').first(), 1); // the second reading
    await expect(page.getByRole('radio', { name: "They don't want to talk to me." })).toBeChecked();
    await rateByKeyboard(page, 'How sure are you that this reading is right?', 8);
    await pressButton(page, 'Next');

    await step(page, 'Could these explain it?');
    await expect(page.getByRole('heading', { name: 'What happened' })).toBeVisible();
    await choose(page, page.getByRole('checkbox', { name: "They've got a lot going on right now." }));
    await choose(page, page.getByRole('checkbox', { name: 'They saw it at a bad moment and forgot.' }));
    await pressButton(page, 'Done');
    await expect(page.getByRole('status')).toContainText('What happened could fit 3 readings, including yours.');
    await expectNoSeriousA11yIssues(page, 'what the facts could fit');
    await pressButton(page, 'Next');

    await step(page, 'Can you find out?');
    await choose(page, page.getByRole('radio', { name: "I'll ask them" }));
    await expect(page.getByRole('status')).toContainText('One way to ask without assuming your reading');
    await expectNoSeriousA11yIssues(page, 'how to find out');
    await pressButton(page, 'Next');

    await step(page, 'Your first reading, looked at again');
    await expect(page.getByText("In Step 2, this was your first reading: ‘They don't want to talk to me.’")).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Two questions to keep' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0); // no comparison before rating
    await rateByKeyboard(page, 'Thinking back to that first reading: how sure are you now that it was right?', 5);
    await expect(page.getByRole('status')).toContainText('In Step 2 you rated it 8. Now you rate it 5.');
    await expectNoSeriousA11yIssues(page, 'first reading looked at again');
    await pressButton(page, 'Finish');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Plan your first step' })).toBeVisible();

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    expect((await savedSession(page, id)).ratings).toEqual({
      cs3_certainty_pre: 8,
      cs3_certainty_post: 5,
    });
  });
});

test.describe('Cognitive shifts area', () => {
  test('lists the three exercises and passes the scan, also in dark mode', async ({ page }) => {
    await page.goto('/areas/cognitive-shifts');
    await expect(page.getByRole('heading', { level: 1, name: 'Cognitive shifts' })).toBeVisible();
    await expect(page.locator('.experiences h3')).toHaveText([
      'Other ways to read it',
      'Why did it happen?',
      'Not enough to go on',
    ]);
    await expectNoSeriousA11yIssues(page, 'area page');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoSeriousA11yIssues(page, 'area page, dark');
  });

  test('explanations show the evidence layers and who took part', async ({ page }) => {
    await page.goto('/session?mode=try&condition=cs_other_readings&why=1');
    const why = page.locator('app-science-section details');
    await expect(why.getByRole('heading', { name: 'Research on the method' })).toBeVisible();
    await expect(why.getByRole('heading', { name: 'Research on similar exercises' })).toBeVisible();
    await expect(why.getByText('170 adults · measured, not an experiment')).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'explanation');
  });

  test('fits a phone screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const url of [
      '/areas/cognitive-shifts',
      '/session?mode=try&condition=cs_why_it_happened&why=1',
    ]) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, url).toBeLessThanOrEqual(0);
    }
  });
});
