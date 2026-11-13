import { Page, expect, test } from '@playwright/test';

import {
  checkByKeyboard,
  expectNoSeriousA11yIssues,
  pressButton,
  beginExercise,
  rateByKeyboard,
  savedSession,
  tabTo,
  typeInto,
} from './helpers';

// Every exercise can be completed with the keyboard alone, every step passes an axe scan,
// and the saved record has the right steps (plan §9, Stage 3). The 4.5-minute dot rounds
// are fast-forwarded with Playwright's clock; the exercise's own timing is unchanged.

const UNPLEASANT = 'Right now, how unpleasant does starting it feel?';
const VIVID = 'How vivid is your picture right now?';
const PICTURE_UNPLEASANT = 'How unpleasant does your picture feel right now?';

/** Opens the exercise from its card, begins it, and returns the saved exercise's id. */
async function open(page: Page, condition: string): Promise<string> {
  await page.clock.install();
  await page.goto('/areas/action-growth');
  const card = page.locator('li.card', {
    has: page.getByRole('heading', { name: exerciseName(condition) }),
  });
  await expect(card).toBeVisible();
  await pressButtonIn(page, card.getByRole('button', { name: 'Try it' }));
  await expect(page).toHaveURL(/\/session\?/);
  await expectNoSeriousA11yIssues(page, `${condition}: preview`);
  return beginExercise(page);
}

async function pressButtonIn(page: Page, button: ReturnType<Page['getByRole']>): Promise<void> {
  await tabTo(page, button);
  await page.keyboard.press('Enter');
}

function exerciseName(condition: string): string {
  return {
    action_bridge: 'Plan your first step',
    goal_restatement: 'Write down your goal',
    'state_reset+action_bridge': 'Picture it, then follow the dot',
    'game_only+action_bridge': 'Follow the dot, then plan',
  }[condition]!;
}

async function unpleasantRating(page: Page, value: number, where: string): Promise<void> {
  await expect(page.getByRole('heading', { name: /How starting feels/ })).toBeFocused();
  await expectNoSeriousA11yIssues(page, where);
  await rateByKeyboard(page, UNPLEASANT, value);
  await pressButton(page, 'Continue');
}

async function actionBridge(page: Page, where: string): Promise<void> {
  await expect(page.getByLabel('What do you want to start?')).toBeVisible();
  await expectNoSeriousA11yIssues(page, `${where}: plan`);
  await typeInto(page, 'What do you want to start?', 'linear algebra');
  await typeInto(page, /^When it is/, '7 pm');
  await typeInto(page, /^Then I will… \(one tiny/, 'open chapter 3');
  await pressButton(page, 'Continue');
  await expect(page.getByRole('heading', { name: 'Your plan' })).toBeVisible();
  await expectNoSeriousA11yIssues(page, `${where}: read back`);
  await checkByKeyboard(page, "I've read my plan twice");
  await pressButton(page, 'Continue');
}

/** Practice round, 10 s hold and 8 timed rounds of the dot game, by keyboard. */
async function dotGame(page: Page, where: string): Promise<void> {
  await expect(page.getByRole('img', { name: /dot/i })).toBeVisible(); // the labelled preview
  await expectNoSeriousA11yIssues(page, `${where}: game preview`);
  await pressButton(page, 'Start practice');
  const game = page.getByRole('application');
  await expect(game).toBeFocused();
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(500);
  await page.keyboard.up('ArrowLeft');
  await page.clock.runFor(16_000);
  await expect(page.getByText('Practice done.')).toBeVisible();
  await pressButton(page, "I'm ready");
  await expectNoSeriousA11yIssues(page, `${where}: hold`);
  await page.clock.runFor(11_000);
  await expect(page.getByRole('application')).toBeVisible();
  await expectNoSeriousA11yIssues(page, `${where}: round`);
  await page.clock.runFor(275_000);
}

test.describe('keyboard only', () => {
  test('Plan your first step', async ({ page }) => {
    const id = await open(page, 'action_bridge');
    await unpleasantRating(page, 6, 'plan: rating before');
    await actionBridge(page, 'plan');
    await unpleasantRating(page, 3, 'plan: rating after');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeFocused();
    await expectNoSeriousA11yIssues(page, 'plan: done');

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    const saved = await savedSession(page, id);
    expect(saved.mode).toBe('try');
    expect(saved.steps.map((s) => s.step)).toEqual(['pre_rating', 'action_bridge', 'post_rating']);
    // Try it keeps only that the exercise ran, and when (M1): no plan, no ratings.
    expect(saved.ratings).toBeNull();
    expect(saved.plan).toBeNull();
    expect(saved.steps.map((s) => s.result)).toEqual([{}, {}, {}]);
  });

  test('Write down your goal', async ({ page }) => {
    const id = await open(page, 'goal_restatement');
    await unpleasantRating(page, 5, 'goal: rating before');
    await typeInto(page, 'What is your goal?', 'learn linear algebra');
    await typeInto(page, 'What will you work on today?', 'eigenvectors');
    await expectNoSeriousA11yIssues(page, 'goal: write');
    await pressButton(page, 'Continue');
    await checkByKeyboard(page, "I've read them twice");
    await expectNoSeriousA11yIssues(page, 'goal: read back');
    await pressButton(page, 'Continue');
    await unpleasantRating(page, 5, 'goal: rating after');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    expect((await savedSession(page, id)).steps.map((s) => s.step)).toEqual([
      'pre_rating',
      'goal_restatement',
      'post_rating',
    ]);
  });

  test('Picture it, then follow the dot', async ({ page }) => {
    const id = await open(page, 'state_reset+action_bridge');
    await unpleasantRating(page, 7, 'picture: rating before');
    await expectNoSeriousA11yIssues(page, 'picture: intro');
    await pressButton(page, 'Next');
    await expectNoSeriousA11yIssues(page, 'picture: choose');
    await typeInto(
      page,
      'Describe your picture in a few words',
      'opening chapter 3 and feeling lost',
    );
    await pressButton(page, 'Next');
    await expectNoSeriousA11yIssues(page, 'picture: picture ratings');
    await rateByKeyboard(page, VIVID, 8);
    await rateByKeyboard(page, PICTURE_UNPLEASANT, 6);
    await pressButton(page, 'Next');
    await dotGame(page, 'picture');
    await rateByKeyboard(page, VIVID, 5);
    await rateByKeyboard(page, PICTURE_UNPLEASANT, 4);
    await pressButton(page, 'Continue');
    await actionBridge(page, 'picture');
    await unpleasantRating(page, 4, 'picture: rating after');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    const saved = await savedSession(page, id);
    expect(saved.steps.map((s) => s.step)).toEqual([
      'pre_rating',
      'state_reset',
      'action_bridge',
      'post_rating',
    ]);
    // Try it keeps only which game ran (M1); the game's data belongs to the experiment's record.
    expect(saved.steps[1].result).toEqual({ task: 'dot' });
    expect(saved.ratings).toBeNull();
    expect(JSON.stringify(saved)).not.toContain('chapter 3 and feeling lost'); // never saved
  });

  // Reduced motion is checked here too: with it switched on, the dot moves at half speed.
  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('Follow the dot, then plan', async ({ page }) => {
      const id = await open(page, 'game_only+action_bridge');
      await unpleasantRating(page, 6, 'game: rating before');
      await expectNoSeriousA11yIssues(page, 'game: intro');
      await pressButton(page, 'Next');
      await dotGame(page, 'game');
      await actionBridge(page, 'game');
      await unpleasantRating(page, 5, 'game: rating after');
      await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();

      await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
      const saved = await savedSession(page, id);
      expect(saved.steps.map((s) => s.step)).toEqual([
        'pre_rating',
        'game_only',
        'action_bridge',
        'post_rating',
      ]);
      // The half speed under reduced motion is checked in state-reset.spec.ts: Try it keeps no
      // game data (M1).
      expect(saved.steps[1].result).toEqual({ task: 'dot' });
    });
  });

  test('Sound version of the dot game', async ({ page }) => {
    const id = await open(page, 'game_only+action_bridge');
    await unpleasantRating(page, 4, 'sound: rating before');
    await pressButton(page, 'Next');
    await pressButton(page, 'Use the sound version');
    await expect(page.getByRole('heading', { name: 'How the sound game works' })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'sound: how it works');
    await pressButton(page, 'Play the high tone');
    await pressButton(page, 'Start practice');
    const game = page.getByRole('application', { name: /Sound game/ });
    await expect(game).toBeFocused();
    await expectNoSeriousA11yIssues(page, 'sound: practice');
    await page.clock.runFor(2_000);
    await page.keyboard.press('Space');
    await page.clock.runFor(14_000);
    await expect(page.getByText('Practice done.')).toBeVisible();
    await pressButton(page, "I'm ready");
    await page.clock.runFor(11_000);
    await expect(page.getByText('Listen for the high tones.')).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'sound: round');
    await page.clock.runFor(275_000);
    await actionBridge(page, 'sound');
    await unpleasantRating(page, 4, 'sound: rating after');
    await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible();

    await expect.poll(async () => (await savedSession(page, id)).status).toBe('completed');
    const saved = await savedSession(page, id);
    expect(saved.content_versions['state-reset-sound']).toBe('1');
    // Try it keeps which game ran, so the sound content version is still recorded (M1).
    expect(saved.steps[1].result).toEqual({ task: 'sound' });
  });
});
