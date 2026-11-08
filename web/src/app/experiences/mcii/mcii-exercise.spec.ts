import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { SessionUpsert } from '../../api/types';
import { SessionPage } from '../../flow/session-page';
import { VISUAL_SOURCE, VisualRequest, VisualSource } from '../../shared/visual/visual';
import { Mcii } from './mcii';

// The MCII exercise, run through the session page as a person would. Everything a person writes
// is marked PRIVATE and must never appear in a saved record, or reach a visual source.

interface Run {
  fixture: ComponentFixture<SessionPage>;
  backend: HttpTestingController;
  bodies: SessionUpsert[];
}

function start(mode = 'try', source?: VisualSource): Run {
  TestBed.configureTestingModule({
    imports: [SessionPage],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap({ mode, condition: 'mcii' }) } },
      },
    ],
  });
  if (source) {
    TestBed.overrideComponent(Mcii, { set: { providers: [{ provide: VISUAL_SOURCE, useValue: source }] } });
  }
  const fixture = TestBed.createComponent(SessionPage);
  return { fixture, backend: TestBed.inject(HttpTestingController), bodies: [] };
}

const root = (run: Run) => run.fixture.nativeElement as HTMLElement;
const text = (run: Run) => root(run).textContent ?? '';
const last = (run: Run) => {
  const body = run.bodies[run.bodies.length - 1];
  return { ...body, steps: body.steps ?? [] };
};

async function settle(run: Run): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await run.fixture.whenStable();
    for (const req of run.backend.match((r) => r.method === 'PUT')) {
      run.bodies.push(req.request.body as SessionUpsert);
      req.flush({});
    }
  }
}

function button(run: Run, name: string): HTMLButtonElement {
  const found = Array.from(root(run).querySelectorAll('button')).find((b) => b.textContent?.trim() === name);
  if (!found) throw new Error(`No button "${name}"`);
  return found;
}

async function press(run: Run, name: string): Promise<void> {
  expect(button(run, name).disabled, `"${name}" is enabled`).toBe(false);
  button(run, name).click();
  await settle(run);
}

async function pick(run: Run, selector: string): Promise<void> {
  const input = root(run).querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`No input ${selector}`);
  input.click();
  await settle(run);
}

async function rate(run: Run, nth: number, value: number): Promise<void> {
  const scale = root(run).querySelectorAll('app-rating-scale')[nth];
  scale.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click();
  await settle(run);
}

async function write(run: Run, value: string, nth = 0): Promise<void> {
  const field = root(run).querySelectorAll<HTMLInputElement>('input[type="text"]')[nth];
  field.value = value;
  field.dispatchEvent(new Event('input'));
  await settle(run);
}

function heading(run: Run): string {
  return root(run).querySelector('h2.progress')?.textContent?.trim() ?? '';
}

async function toObstacle(run: Run): Promise<void> {
  await settle(run);
  await press(run, 'Begin');
  await write(run, 'PRIVATE wish');
  await pick(run, 'input[name="mcii-category"][value="work"]');
  await rate(run, 0, 8);
  await rate(run, 1, 6);
  await press(run, 'Next');
  await write(run, 'PRIVATE outcome');
  await press(run, 'Done');
  await press(run, 'Next');
}

async function toDecide(run: Run, obstacle = 'tired'): Promise<void> {
  await toObstacle(run);
  await pick(run, `input[name="mcii-obstacle"][value="${obstacle}"]`);
  if (obstacle === 'own' || obstacle === 'outside') await write(run, 'PRIVATE obstacle');
  await press(run, 'Done');
  await press(run, 'Next');
}

async function decide(run: Run, choice: string, rating = 3): Promise<void> {
  await rate(run, 0, rating);
  await pick(run, `input[name="mcii-decide"][value="${choice}"]`);
  if (choice === 'change') await write(run, 'PRIVATE new wish');
  await press(run, 'Next');
}

async function finishWithPlan(run: Run): Promise<void> {
  await pick(run, 'input[value="five_minutes"]');
  await press(run, 'Done');
  await press(run, 'Next');
  await rate(run, 0, 7);
  await pick(run, 'input[name="mcii-feeling"][value="same"]');
  await press(run, 'Finish');
}

describe('MCII exercise', () => {
  it('runs in order, keeping the plan and saving only ids, choices and ratings', async () => {
    const run = start();
    await toDecide(run);
    await decide(run, 'keep');
    await finishWithPlan(run);

    const body = last(run);
    expect(text(run)).toContain('Exercise complete');
    expect(body.status).toBe('completed');
    expect(body.mode).toBe('try');
    expect(body.condition).toBe('mcii');
    expect(body.content_versions).toEqual({ mcii: '2' });
    expect(body.plan).toBeNull();
    expect(body.steps.map((s) => s.step)).toEqual([
      'mcii_wish',
      'mcii_outcome',
      'mcii_obstacle',
      'mcii_decide',
      'mcii_plan',
      'mcii_close',
    ]);
    expect(body.steps.map((s) => s.result)).toEqual([
      { category: 'work', visual_source: expect.stringMatching(/^scene:mcii\.path@\d+;theme:action@\d+$/) },
      {},
      { obstacle: 'tired' },
      { choice: 'keep' },
      { then: 'five_minutes' },
      { feeling: 'same' },
    ]);
    expect(body.ratings).toEqual({
      mcii_matter_pre: 8,
      mcii_likely_pre: 6,
      mcii_likely_post: 3,
      mcii_ready_post: 7,
    });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('asks for the future before the obstacle, and shows the future again first', async () => {
    const run = start();
    await settle(run);
    await press(run, 'Begin');
    expect(heading(run)).toContain('Step 1 of 6: Your wish');
    expect(text(run)).toContain("It isn't for painful experiences");
    expect(text(run)).toContain('changing another person');
    await write(run, 'PRIVATE wish');
    await pick(run, 'input[name="mcii-category"][value="work"]');
    await rate(run, 0, 8);
    expect(button(run, 'Next').disabled).toBe(true);
    await rate(run, 1, 6);
    await press(run, 'Next');

    expect(heading(run)).toContain('Step 2 of 6: The best part');
    expect(text(run)).toContain('Your wish: “PRIVATE wish”');
    await write(run, 'PRIVATE outcome');
    expect(text(run)).not.toContain('Now picture it.');
    await press(run, 'Done');
    expect(text(run)).toContain('Now picture it.');
    await press(run, 'Next');

    expect(heading(run)).toContain("Step 3 of 6: What's in the way");
    expect(text(run)).toContain('The best part: “PRIVATE outcome”');
    expect(button(run, 'Done').disabled).toBe(true);
    await pick(run, 'input[name="mcii-obstacle"][value="tired"]');
    await press(run, 'Done');
    expect(text(run)).toContain('Now picture the moment it happens.');
    await press(run, 'Next');

    expect(heading(run)).toContain('Step 4 of 6: Look at both');
    const blocks = Array.from(root(run).querySelectorAll('.both .facts p')).map((p) => p.textContent);
    expect(blocks).toEqual(['PRIVATE outcome', "I put it off when I'm tired."]);
  });

  it('says on step 4 which wish the likelihood question is about', async () => {
    const run = start();
    await toDecide(run);
    const wish = root(run).querySelector('p.quote');
    expect(wish?.textContent).toBe('Your wish: “PRIVATE wish”');
    const blocks = root(run).querySelector('.both');
    expect(wish!.compareDocumentPosition(blocks!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const question = root(run).querySelector('app-rating-scale legend')?.textContent;
    expect(question).toBe("Now that you've looked at both, how likely do you think it is that your wish will come true?");
    await rate(run, 0, 3);
    expect(text(run)).toContain('not whether your wish will come true.');
    expect(text(run)).not.toMatch(/\bit is to happen\b|whether it will happen/);
  });

  it('asks about the wish by name in step 1 too', async () => {
    const run = start();
    await settle(run);
    await press(run, 'Begin');
    expect(text(run)).toContain('How likely do you think it is that your wish will come true?');
    expect(text(run)).not.toContain('it is to happen');
  });

  it('shows the earlier rating only after the new one, and expects no direction', async () => {
    const run = start();
    await toDecide(run);
    expect(text(run)).not.toContain('Earlier you said');
    await rate(run, 0, 3);
    expect(text(run)).toContain('Earlier you said 6, and now you say 3.');
    expect(text(run)).toContain('No direction is expected.');
  });

  it('gives no advice at a low rating, and accepts any choice with it', async () => {
    const run = start();
    await toDecide(run);
    await rate(run, 0, 0);
    expect(text(run)).toContain("can't tell you whether your wish is realistic");
    expect(text(run)).not.toMatch(/give up|let go|you should|too low|unrealistic/i);
    await pick(run, 'input[name="mcii-decide"][value="keep"]');
    expect(button(run, 'Next').disabled).toBe(false);
    await pick(run, 'input[name="mcii-decide"][value="set_aside"]');
    expect(button(run, 'Next').disabled).toBe(false);
  });

  it('builds the plan on the obstacle, in words that read as a sentence', async () => {
    const run = start();
    await toDecide(run);
    await decide(run, 'keep');
    expect(heading(run)).toContain("Step 5 of 6: What you'll do");
    const ifField = root(run).querySelector<HTMLInputElement>('input[type="text"]')!;
    expect(ifField.value).toBe("I'm tired and want to put it off");
    await pick(run, 'input[value="five_minutes"]');
    expect(text(run)).not.toContain('Your plan:');
    await press(run, 'Done');
    expect(text(run)).toContain("Your plan: If I'm tired and want to put it off, then I will start with just five minutes.");
    expect(text(run)).toContain('Say it to yourself slowly');
  });

  it('carries a rewritten wish forward, without saving it', async () => {
    const run = start();
    await toDecide(run);
    await rate(run, 0, 4);
    await pick(run, 'input[name="mcii-decide"][value="change"]');
    expect(button(run, 'Next').disabled).toBe(true);
    await write(run, 'PRIVATE new wish');
    await press(run, 'Next');
    expect(text(run)).toContain('Your wish: “PRIVATE new wish”');
    await finishWithPlan(run);
    expect(last(run).steps[3].result).toEqual({ choice: 'change' });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('accepts setting the wish aside as a real decision, with no plan and no readiness question', async () => {
    const run = start();
    await toDecide(run);
    await decide(run, 'set_aside');
    expect(heading(run)).toContain("Step 5 of 6: What you'll do");
    expect(text(run)).toContain("You've set this wish aside. That's a real decision too.");
    expect(root(run).querySelector('input[type="text"]')).toBeNull();
    await press(run, 'Next');
    expect(heading(run)).toContain('Step 6 of 6: Keeping it');
    expect(text(run)).not.toContain('Copy my plan');
    expect(text(run)).not.toContain('How ready');
    await pick(run, 'input[name="mcii-feeling"][value="same"]');
    await press(run, 'Finish');
    const body = last(run);
    expect(body.status).toBe('completed');
    expect(body.steps.map((s) => s.result).slice(3)).toEqual([{ choice: 'set_aside' }, { then: null }, { feeling: 'same' }]);
    expect(body.ratings).not.toHaveProperty('mcii_ready_post');
  });

  it('treats "mostly outside me" as a valid answer, with an honest note', async () => {
    const run = start();
    await toDecide(run, 'outside');
    expect(text(run)).toContain('A plan can only cover the part you can do something about.');
    await decide(run, 'keep');
    expect(root(run).querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('PRIVATE obstacle');
    await finishWithPlan(run);
    expect(last(run).steps[2].result).toEqual({ obstacle: 'outside' });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('saves "own" for a written obstacle and a written response, never the words', async () => {
    const run = start();
    await toDecide(run, 'own');
    await decide(run, 'keep');
    await pick(run, 'app-card-pick input[value="own"]');
    await write(run, 'PRIVATE response', 1);
    await press(run, 'Done');
    await press(run, 'Next');
    await rate(run, 0, 5);
    await pick(run, 'input[name="mcii-feeling"][value="encouraged"]');
    await press(run, 'Finish');
    const body = last(run);
    expect(body.steps[2].result).toEqual({ obstacle: 'own' });
    expect(body.steps[4].result).toEqual({ then: 'own' });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('responds to feeling discouraged, and only then', async () => {
    const run = start();
    await toDecide(run);
    await decide(run, 'keep');
    await pick(run, 'input[value="five_minutes"]');
    await press(run, 'Done');
    await press(run, 'Next');
    expect(text(run)).not.toContain('can feel discouraging');
    await pick(run, 'input[name="mcii-feeling"][value="discouraged"]');
    expect(text(run)).toContain('can feel discouraging');
    expect(text(run)).toContain('a support line');
    await pick(run, 'input[name="mcii-feeling"][value="encouraged"]');
    expect(text(run)).not.toContain('can feel discouraging');
  });

  describe('copying the plan', () => {
    async function toClose(run: Run): Promise<void> {
      await toDecide(run);
      await decide(run, 'keep');
      await pick(run, 'input[value="five_minutes"]');
      await press(run, 'Done');
      await press(run, 'Next');
    }

    function mockClipboard(writeText: (text: string) => Promise<void>): void {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    }

    it('copies the wish, the best part and the plan, without saving any of it', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      mockClipboard(writeText);
      const run = start();
      await toClose(run);
      expect(writeText).not.toHaveBeenCalled(); // only when asked
      await press(run, 'Copy my plan');
      expect(writeText).toHaveBeenCalledWith(
        "My wish: PRIVATE wish\nThe best part: PRIVATE outcome\nMy plan: If I'm tired and want to put it off, then I will start with just five minutes.",
      );
      expect(text(run)).toContain('Copied.');
      expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
    });

    it('says so when copying fails, and the exercise carries on', async () => {
      mockClipboard(() => Promise.reject(new Error('denied')));
      const run = start();
      await toClose(run);
      await press(run, 'Copy my plan');
      expect(text(run)).toContain("That didn't work.");
      await rate(run, 0, 7);
      await pick(run, 'input[name="mcii-feeling"][value="same"]');
      await press(run, 'Finish');
      expect(text(run)).toContain('Exercise complete');
    });
  });

  it('has Stop on every step, recording only where it stopped', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const run = start();
    await toObstacle(run);
    await press(run, 'Stop the exercise');
    const body = last(run);
    expect(body.status).toBe('aborted');
    expect(body.steps[body.steps.length - 1]).toMatchObject({ step: 'stopped', result: { during: 'mcii_obstacle' } });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('runs only in Try it, never in the experiment', async () => {
    for (const mode of ['self_use', 'dev']) {
      TestBed.resetTestingModule();
      const run = start(mode);
      await settle(run);
      expect(text(run)).toContain('This exercise link is incomplete.');
    }
  });

  it('shows the explanation before Begin, with the method named as MCII', async () => {
    const run = start();
    await settle(run);
    expect(text(run)).toContain('Picturing the obstacle, then planning (MCII)');
    expect(root(run).querySelector('app-science-section')).not.toBeNull();
    expect(text(run)).toContain('Choose a wish for the next four weeks.');
  });

  describe('the picture', () => {
    function shownAlt(run: Run): string | null | undefined {
      return root(run).querySelector('figure')?.getAttribute('aria-label');
    }
    const drawn = (run: Run, id: string) => root(run).querySelector<SVGElement>(`figure [data-vis-id="${id}"]`);

    it('adds the wall with the obstacle, and the bridge only after the plan is made', async () => {
      const run = start();
      await settle(run);
      await press(run, 'Begin');
      expect(shownAlt(run)).toBe('A path leading to a far marker.');
      expect(drawn(run, 'wish')).not.toBeNull();
      expect(drawn(run, 'wall')).toBeNull();
      run.fixture.destroy();

      TestBed.resetTestingModule();
      const next = start();
      await toDecide(next);
      expect(shownAlt(next)).toBe('A path leading to a far marker, with a low wall across it.');
      expect(drawn(next, 'wall')).not.toBeNull();
      expect(drawn(next, 'bridge')).toBeNull();
      await decide(next, 'keep');
      expect(drawn(next, 'bridge')).not.toBeNull();
    });

    it('quietens the path after setting aside, with no wall, and the wish keeps its colour', async () => {
      const run = start();
      await toDecide(run);
      await decide(run, 'set_aside');
      expect(shownAlt(run)).toBe('A faded path leading to a far marker.');
      expect(drawn(run, 'wall')).toBeNull();
      expect(drawn(run, 'path')?.style.strokeWidth).toBe('1.5px');
      expect(drawn(run, 'wish')?.style.stroke).toBe('var(--vis-subject)');
    });

    /** What a run saves, leaving out timings and the source's own id. */
    function saved(run: Run) {
      const body = last(run);
      return {
        status: body.status,
        ratings: body.ratings,
        results: body.steps.map((s) => {
          const { visual_source: _source, ...rest } = s.result ?? {};
          return { step: s.step, ...rest };
        }),
      };
    }

    async function fullRun(source?: VisualSource): Promise<Run> {
      const run = start('try', source);
      await toDecide(run);
      await decide(run, 'keep');
      await finishWithPlan(run);
      return run;
    }

    it('saves the same, apart from the source id, whatever the source does', async () => {
      const baseline = saved(await fullRun());
      const sources: VisualSource[] = [
        { id: 'none.v1', resolve: () => Promise.resolve({ kind: 'none' }) },
        { id: 'down.v1', resolve: () => Promise.reject(new Error('down')) },
        { id: 'slow.v1', resolve: () => new Promise(() => undefined) },
      ];
      for (const source of sources) {
        TestBed.resetTestingModule();
        const run = await fullRun(source);
        expect(saved(run), source.id).toEqual(baseline);
        expect(last(run).steps[0].result).toMatchObject({ visual_source: source.id });
      }
    }, 30000);

    it('sends a source scene ids only, and the same one while the person is choosing', async () => {
      const requests: VisualRequest[] = [];
      const recording: VisualSource = {
        id: 'test.v1',
        resolve: (request) => {
          requests.push(request);
          return Promise.resolve({ kind: 'none' });
        },
      };
      const run = start('try', recording);
      await toDecide(run);
      requests.length = 0;
      await rate(run, 0, 2);
      await pick(run, 'input[name="mcii-decide"][value="set_aside"]');
      await pick(run, 'input[name="mcii-decide"][value="keep"]');
      expect(requests).toEqual([]); // the request didn't change, so nothing was asked again
      await press(run, 'Next');
      await finishWithPlan(run);
      expect(requests.map((r) => r.scene)).toEqual(['mcii.plan', 'mcii.plan']);
      expect(JSON.stringify(requests)).not.toContain('PRIVATE');
    });
  });
});
