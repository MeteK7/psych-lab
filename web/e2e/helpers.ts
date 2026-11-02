import AxeBuilder from '@axe-core/playwright';
import { Locator, Page, expect } from '@playwright/test';

/** WCAG 2.2 AA, the plan's accessibility baseline (§8). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Scans the page as it is now; serious and critical violations fail the test. */
export async function expectNoSeriousA11yIssues(page: Page, where: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const serious = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    );
  expect(serious, `${where}: accessibility problems`).toEqual([]);
}

/** Presses Tab until the target has focus, as a keyboard-only user would. */
export async function tabTo(page: Page, target: Locator, maxPresses = 60): Promise<void> {
  for (let i = 0; i < maxPresses; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not reach ${target} with the Tab key`);
}

/** Moves focus to a button by keyboard and presses Enter. */
export async function pressButton(page: Page, name: string | RegExp): Promise<void> {
  const button = page.getByRole('button', { name, exact: typeof name === 'string' });
  await expect(button).toBeEnabled();
  await tabTo(page, button);
  await page.keyboard.press('Enter');
}

/** Types into a field reached by keyboard. */
export async function typeInto(page: Page, label: string | RegExp, text: string): Promise<void> {
  const field = page.getByLabel(label);
  await tabTo(page, field);
  await page.keyboard.type(text);
}

/** Answers a 0–10 scale by keyboard: Tab into the group, then arrow keys. */
export async function rateByKeyboard(
  page: Page,
  legend: string | RegExp,
  value: number,
): Promise<void> {
  const group = page.getByRole('group', { name: legend });
  const first = group.getByRole('radio').first();
  await tabTo(page, first);
  await page.keyboard.press('Space'); // selects 0
  for (let i = 0; i < value; i++) await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: String(value), exact: true })).toBeChecked();
}

/** Ticks a checkbox by keyboard. */
export async function checkByKeyboard(page: Page, label: string | RegExp): Promise<void> {
  const box = page.getByLabel(label);
  await tabTo(page, box);
  await page.keyboard.press('Space');
  await expect(box).toBeChecked();
}

export interface SavedSession {
  id: string;
  mode: string;
  condition: string;
  status: string;
  steps: { step: string; result: Record<string, unknown> }[];
  ratings: Record<string, number> | null;
  content_versions: Record<string, string>;
}

/** Presses Begin and returns the new exercise's id, taken from its first save. */
export async function beginExercise(page: Page): Promise<string> {
  const firstSave = page.waitForRequest(
    (r) => r.method() === 'PUT' && /\/api\/sessions\/[0-9a-f-]{36}$/.test(r.url()),
  );
  await pressButton(page, 'Begin');
  return (await firstSave).url().split('/').pop()!;
}

/** One exercise, read back from the API by its id. */
export async function savedSession(page: Page, id: string): Promise<SavedSession> {
  const response = await page.request.get('/api/sessions?limit=200');
  expect(response.ok()).toBe(true);
  const session = ((await response.json()) as SavedSession[]).find((s) => s.id === id);
  if (!session) throw new Error(`Exercise ${id} was not saved`);
  return session;
}
