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

    await step(page, 'Your first reading, looked at again');
    await expect(page.getByText('In Step 1, this was your first reading: ‘PRIVATE first reading’')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0); // no comparison before rating
    await rateByKeyboard(page, 'Thinking back to that first reading: how much do you believe it now?', 4);
    await rateByKeyboard(page, 'And how upsetting does it feel now?', 3);
    await expect(page.getByRole('status')).toContainText('In Step 2 you rated your belief in it 7. Now you rate it 4.');
    await expect(page.getByRole('status')).toContainText('In Step 2 you rated how upsetting it felt 6. Now you rate it 3.');
    await expectNoSeriousA11yIssues(page, 'first reading looked at again');
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
    // Try it keeps only that the exercise ran, and when (M1); the ratings are checked in
    // cs-exercises.spec.ts.
    expect((await savedSession(page, id)).ratings).toBeNull();
  });
});

// "Change the camera angle" (camera-angle-design.md §2 with the §9.9 decisions), by keyboard alone.
test.describe('Change the camera angle, keyboard only', () => {
  async function toStepBack(page: Page): Promise<string> {
    const id = await open(page, 'cs_camera_angle');
    await step(page, 'The moment');
    await typeInto(page, /The moment, in a few words/, 'PRIVATE moment');
    await rateByKeyboard(page, 'How upsetting does it feel right now?', 8);
    // At 8 or more, a note; it never blocks.
    await expect(page.getByRole('status')).toContainText('This exercise is meant for smaller things.');
    await expectNoSeriousA11yIssues(page, 'high-upset note');
    await pressButton(page, 'Next');

    await step(page, 'Through your own eyes');
    await expect(page.locator('app-vis-viewpoint-slot, app-vis-instrument-slot')).toHaveCount(0);
    await typeInto(page, /What happened, and what you felt/, 'PRIVATE own eyes');
    await pressButton(page, 'Skip this step');

    await step(page, 'Step back');
    await expect(page.getByText("The drawing isn't your moment.")).toBeVisible();
    // The moving picture is a picture named by its text alternative; the slider is the keyboard's way.
    await expect(page.getByRole('img', { name: /^Through your own eyes/ })).toBeVisible();
    return id;
  }

  test('steps back by the slider, and looks from there as an observer', async ({ page }) => {
    const id = await toStepBack(page);
    const slider = page.getByRole('slider', { name: 'Where you look from' });
    await tabTo(page, slider);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('2');
    await expect(slider).toHaveAttribute('aria-valuetext', 'From across the room');
    await expect(page.getByRole('img', { name: /^From across the room/ })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'stepped back');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoSeriousA11yIssues(page, 'stepped back, dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await pressButton(page, 'Next');

    await step(page, 'From here');
    await expect(page.getByRole('img', { name: /^From across the room/ })).toBeVisible();
    await expect(page.getByText('Why do you think they felt the way they did?')).toBeVisible();
    await typeInto(page, /Your thoughts/, 'PRIVATE why');
    await choose(page, page.getByRole('checkbox', { name: 'What the others may have been dealing with' }));
    await pressButton(page, 'Next');

    await step(page, 'Where you ended up');
    await choose(page, page.getByRole('radio', { name: 'Mostly through my own eyes' }), 2); // → Mostly from the outside
    await expect(page.getByRole('radio', { name: 'Mostly from the outside' })).toBeChecked();
    await rateByKeyboard(page, 'How upsetting does it feel right now?', 5);
    await expect(page.getByRole('status')).toContainText("Earlier you said 8; now you say 5. This isn't a score");
    await choose(page, page.getByRole('radio', { name: 'Yes', exact: true }), 1); // → Partly
    await expect(page.getByRole('radio', { name: 'Partly', exact: true })).toBeChecked();
    await expectNoSeriousA11yIssues(page, 'where you ended up');
    await pressButton(page, 'Next');

    await step(page, "What you're keeping");
    await expect(page.getByText('PRIVATE why')).toBeVisible();
    await expect(page.getByText('PRIVATE own eyes')).toHaveCount(0); // skipped: not kept
    await pressButton(page, 'Finish');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Plan your first step' })).toBeVisible();

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    const saved = await savedSession(page, id);
    // Try it keeps only that it ran, when, and which picture was drawn.
    expect(saved.ratings).toBeNull();
    expect(saved.steps.find((s) => s.step === 'cam_step_back')?.result).toEqual({
      visual_source: expect.stringMatching(/^instrument:camera-angle\.room@3;theme:cognitive@\d+$/),
    });
    expect(JSON.stringify(saved)).not.toContain('PRIVATE');
  });

  test('stays close: options only, with no question and no field', async ({ page }) => {
    await toStepBack(page);
    await pressButton(page, 'Next'); // position 0

    await step(page, 'From here');
    await expect(page.getByRole('img', { name: /^Through your own eyes/ })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Looking at the moment through your own eyes:' })).toBeVisible();
    await expect(page.locator('main textarea, main input[type="text"]')).toHaveCount(0);
    await expect(page.getByRole('checkbox')).toHaveCount(6);
    await choose(page, page.getByRole('checkbox', { name: 'Nothing looks different from here' }));
    await pressButton(page, 'Next');

    await step(page, 'Where you ended up');
    await choose(page, page.getByRole('radio', { name: 'Mostly through my own eyes' }));
    await rateByKeyboard(page, 'How upsetting does it feel right now?', 8);
    await choose(page, page.getByRole('radio', { name: 'Yes', exact: true }), 2); // → No
    await expect(page.getByRole('radio', { name: 'No', exact: true })).toBeChecked();
    await pressButton(page, 'Next');

    await step(page, "What you're keeping");
    await expect(page.getByText("That's a complete way to do this exercise.")).toBeVisible();
    await pressButton(page, 'Finish');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Plan your first step' })).toHaveCount(0);
  });

  test('with reduced motion, the picture cuts to the new position', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await toStepBack(page);
    const slider = page.getByRole('slider', { name: 'Where you look from' });
    await tabTo(page, slider);
    await page.keyboard.press('End');
    await expect(page.getByRole('img', { name: /^From further away/ })).toBeVisible();
    const picture = () => page.locator('app-vis-viewpoint canvas').evaluate((c) => (c as HTMLCanvasElement).toDataURL());
    const cut = await picture();
    await page.waitForTimeout(400);
    expect(await picture()).toBe(cut);
  });
});

test.describe('Cognitive shifts area', () => {
  test('lists the four exercises and passes the scan, also in dark mode', async ({ page }) => {
    await page.goto('/areas/cognitive-shifts');
    await expect(page.getByRole('heading', { level: 1, name: 'Cognitive shifts' })).toBeVisible();
    await expect(page.locator('.experiences h3')).toHaveText([
      'Other ways to read it',
      'Why did it happen?',
      'Not enough to go on',
      'Change the camera angle',
    ]);
    await expect(page.getByRole('heading', { name: 'When you keep replaying a moment' })).toBeVisible();
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

  test('shows the scale labels as a key right beside the scale', async ({ page }) => {
    await open(page, 'cs_not_enough_to_go_on');
    await choose(page, page.getByRole('radio').first());
    await pressButton(page, 'Next');

    const scale = page.locator('app-rating-scale');
    const box = async (locator: ReturnType<Page['locator']>) => (await locator.boundingBox())!;
    const options = await box(scale.locator('.options'));
    const key = await box(scale.locator('.anchors'));
    const min = await box(scale.getByText('0 = not at all'));
    const max = await box(scale.getByText('10 = completely'));

    const middle = (b: { y: number; height: number }) => b.y + b.height / 2;
    expect(Math.abs(middle(key) - middle(options))).toBeLessThanOrEqual(2);
    const gap = key.x - (options.x + options.width);
    expect(gap).toBeGreaterThanOrEqual(16);
    expect(gap).toBeLessThanOrEqual(32);
    expect(min.y).toBeLessThan(max.y);
    const radios = scale.getByRole('radio');
    expect((await box(radios.first())).y).toBe((await box(radios.last())).y); // one line
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
