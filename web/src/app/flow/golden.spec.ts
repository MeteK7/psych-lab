import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { StateReset } from '../experiences/state-reset/state-reset';
import golden from './__golden__/experiment-exercises.json';
import { SessionPage } from './session-page';

// Golden tests for the four Action and growth exercises: every request body the session page
// saves, and the text of every screen, including each exercise's "Why this exercise?" section.
// During development they're ordinary regression tests (docs/plan.md, "Development stage"): if
// a change to these exercises is intended, re-pin the affected cases in the same change and say
// so. When participant data collection approaches, they become a gate again: never re-pinned.
//
// The timed dot rounds are finished directly through the exercise component; their own
// timing is covered by the State Reset tests and the browser tests.

const NOW = new Date('2026-11-02T10:00:00.000Z');
const ID = '00000000-0000-4000-8000-000000000001';
const REVEAL = '11111111-2222-4333-8444-555555555555';

interface Run {
  fixture: ComponentFixture<SessionPage>;
  backend: HttpTestingController;
  bodies: unknown[];
  screens: string[];
}

function start(params: Record<string, string>): Run {
  TestBed.configureTestingModule({
    imports: [SessionPage],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } },
    ],
  });
  const fixture = TestBed.createComponent(SessionPage);
  return { fixture, backend: TestBed.inject(HttpTestingController), bodies: [], screens: [] };
}

const root = (run: Run) => run.fixture.nativeElement as HTMLElement;

/** The visible text of the page, whitespace collapsed. */
async function screen(run: Run): Promise<void> {
  await run.fixture.whenStable();
  run.screens.push(root(run).textContent!.replace(/\s+/g, ' ').trim());
}

/** Lets pending saves go out, answers each one, and keeps its body. */
async function flush(run: Run): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await run.fixture.whenStable();
    for (const req of run.backend.match((r) => r.method === 'PUT')) {
      run.bodies.push(req.request.body);
      req.flush({});
    }
  }
}

function click(run: Run, text: string): void {
  const button = Array.from(root(run).querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`No button "${text}"`);
  button.click();
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

async function step(run: Run, action: () => void): Promise<void> {
  action();
  await flush(run);
  await screen(run);
}

async function rateAll(run: Run, value: number, button: string): Promise<void> {
  for (const fieldset of Array.from(root(run).querySelectorAll('fieldset.scale, app-rating-scale fieldset'))) {
    fieldset.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click();
  }
  await run.fixture.whenStable();
  await step(run, () => click(run, button));
}

async function actionBridge(run: Run): Promise<void> {
  const inputs = root(run).querySelectorAll<HTMLInputElement>('input[type="text"]');
  type(inputs[0], 'linear algebra');
  type(inputs[1], '7 pm');
  type(inputs[2], 'open chapter 3');
  await run.fixture.whenStable();
  await step(run, () => click(run, 'Continue'));
  root(run).querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
  await run.fixture.whenStable();
  await step(run, () => click(run, 'Continue'));
}

async function goalRestatement(run: Run): Promise<void> {
  const inputs = root(run).querySelectorAll<HTMLInputElement>('input[type="text"]');
  type(inputs[0], 'learn linear algebra');
  type(inputs[1], 'eigenvectors');
  await run.fixture.whenStable();
  await step(run, () => click(run, 'Continue'));
  root(run).querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
  await run.fixture.whenStable();
  await step(run, () => click(run, 'Continue'));
}

/** Intro, picture (image variant), picture ratings, practice screen, then a finished game. */
async function stateReset(run: Run, picture: boolean): Promise<void> {
  await step(run, () => click(run, 'Next'));
  if (picture) {
    type(root(run).querySelector<HTMLInputElement>('input[type="text"]')!, 'opening chapter 3');
    await run.fixture.whenStable();
    await step(run, () => click(run, 'Next'));
    await rateAll(run, 5, 'Next');
  }
  const game = run.fixture.debugElement.query(By.directive(StateReset)).componentInstance as unknown as {
    finish(): void;
  };
  game.finish();
  await flush(run);
  await screen(run);
}

async function exercise(condition: string, params: Record<string, string>, stopEarly = false): Promise<Run> {
  const run = start({ condition, ...params });
  await screen(run); // preview
  await step(run, () => click(run, 'Begin'));
  if (stopEarly) {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await step(run, () => click(run, 'Stop the exercise'));
    return run;
  }
  await rateAll(run, 6, 'Continue');
  if (condition === 'action_bridge') await actionBridge(run);
  if (condition === 'goal_restatement') await goalRestatement(run);
  if (condition === 'state_reset+action_bridge') {
    await stateReset(run, true);
    await actionBridge(run);
  }
  if (condition === 'game_only+action_bridge') {
    await stateReset(run, false);
    await actionBridge(run);
  }
  await rateAll(run, 3, 'Continue');
  return run;
}

const CASES: [string, string, Record<string, string>, boolean?][] = [
  ['plan, Try it', 'action_bridge', { mode: 'try' }],
  ['goal, Try it', 'goal_restatement', { mode: 'try' }],
  ['picture, Try it', 'state_reset+action_bridge', { mode: 'try' }],
  ['game, Try it', 'game_only+action_bridge', { mode: 'try' }],
  ['plan, experiment', 'action_bridge', { mode: 'self_use', reveal: REVEAL }],
  ['goal, experiment', 'goal_restatement', { mode: 'self_use', reveal: REVEAL }],
  ['picture, experiment', 'state_reset+action_bridge', { mode: 'self_use', reveal: REVEAL }],
  ['game, experiment', 'game_only+action_bridge', { mode: 'self_use', reveal: REVEAL }],
  ['goal, Test mode', 'goal_restatement', { mode: 'dev', reveal: REVEAL }],
  ['plan, Try it, stopped', 'action_bridge', { mode: 'try' }, true],
];

describe('experiment exercises (golden)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(ID);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  for (const [name, condition, params, stopEarly] of CASES) {
    it(`saves and shows exactly the same: ${name}`, async () => {
      const run = await exercise(condition, params, stopEarly);
      const actual = { bodies: run.bodies, screens: run.screens };
      const expected = (golden as Record<string, unknown>)[name];
      if (expected === undefined) console.log(`GOLDEN>>${JSON.stringify({ [name]: actual })}<<GOLDEN`);
      expect(actual).toEqual(expected);
      run.backend.verify();
    });
  }
});
