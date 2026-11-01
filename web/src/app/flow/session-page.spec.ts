import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { SessionUpsert } from '../api/types';
import { SessionPage } from './session-page';

function setup(params: Record<string, string>) {
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
  return { fixture, backend: TestBed.inject(HttpTestingController) };
}

const root = (f: ComponentFixture<SessionPage>) => f.nativeElement as HTMLElement;

function click(f: ComponentFixture<SessionPage>, text: string): void {
  const button = Array.from(root(f).querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`No button "${text}"`);
  button.click();
}

function type(f: ComponentFixture<SessionPage>, input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

async function rate(f: ComponentFixture<SessionPage>, value: number): Promise<void> {
  const radio = root(f).querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`);
  radio!.click();
  await f.whenStable();
  click(f, 'Continue');
  await f.whenStable();
}

/** Lets the save queue's promise chain finish (whenStable alone does not track it). */
async function settle(f: ComponentFixture<SessionPage>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await f.whenStable();
}

/** Answers the next PUT (saves are sequential) and returns its body. */
async function flushSave(f: ComponentFixture<SessionPage>, backend: HttpTestingController): Promise<SessionUpsert> {
  await settle(f);
  const req = backend.expectOne((r) => r.method === 'PUT' && r.url.startsWith('/api/sessions/'));
  req.flush({});
  await settle(f);
  return req.request.body as SessionUpsert;
}

/** Opens the page and clicks Begin, which creates the session. */
async function begin(params: Record<string, string>) {
  const ctx = setup(params);
  await ctx.fixture.whenStable();
  click(ctx.fixture, 'Begin');
  return ctx;
}

describe('SessionPage', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('rejects a link without a valid condition', async () => {
    const { fixture } = setup({ mode: 'self_use', condition: 'nonsense' });
    await fixture.whenStable();
    expect(root(fixture).querySelector('[role="alert"]')?.textContent).toContain('link is incomplete');
  });

  it('records nothing until Begin is clicked, so a reload cannot create a session', async () => {
    const { fixture, backend } = setup({ mode: 'self_use', condition: 'action_bridge' });
    await settle(fixture);
    backend.expectNone(() => true);
    const text = root(fixture).textContent!;
    expect(text).toContain('Plan your first step');
    expect(text).toContain('Practice: not part of your experiment.');
    expect(text).toContain('Write a short when-then plan and read it twice.');
    expect(text).toContain('About 3 minutes.');
  });

  it('runs a goal-restatement exercise and saves after every step', async () => {
    const { fixture, backend } = await begin({ mode: 'try', condition: 'goal_restatement' });
    expect((await flushSave(fixture, backend)).status).toBe('in_progress');

    expect(root(fixture).textContent).toContain('Step 1 of 3: How starting feels');
    await rate(fixture, 6);
    expect((await flushSave(fixture, backend)).ratings).toEqual({ unpleasant_pre: 6 });

    const inputs = root(fixture).querySelectorAll<HTMLInputElement>('input[type="text"]');
    type(fixture, inputs[0], 'understand neural networks');
    type(fixture, inputs[1], 'backpropagation');
    await fixture.whenStable();
    click(fixture, 'Continue');
    await fixture.whenStable();
    root(fixture).querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await fixture.whenStable();
    click(fixture, 'Continue');
    const afterPlan = await flushSave(fixture, backend);
    expect(afterPlan.plan).toEqual({
      type: 'goal_restatement',
      goal: 'understand neural networks',
      topic: 'backpropagation',
      read_back: true,
    });

    await rate(fixture, 3);
    const final = await flushSave(fixture, backend);
    expect(final.status).toBe('completed');
    expect(final.ended_at).toBeTruthy();
    expect(final.ratings).toEqual({ unpleasant_pre: 6, unpleasant_post: 3 });
    expect(final.steps?.map((s) => s.step)).toEqual(['pre_rating', 'goal_restatement', 'post_rating']);
    expect(final.content_versions).toEqual({ ratings: '2', 'goal-restatement': '2' });
    expect(root(fixture).textContent).toContain('Exercise complete');
    expect(root(fixture).textContent).toContain('Saved at');
    // The outcome window is never mentioned during or after an exercise.
    expect(root(fixture).textContent).not.toContain('window');
    expect(root(fixture).textContent).toContain('Back to Action and growth');
  });

  it('links an experiment exercise to its reveal and leads back to My experiment', async () => {
    const reveal = '11111111-2222-4333-8444-555555555555';
    const { fixture, backend } = setup({ mode: 'self_use', condition: 'action_bridge', reveal });
    await fixture.whenStable();
    expect(root(fixture).textContent).toContain('Assigned for today by your experiment.');
    click(fixture, 'Begin');
    expect((await flushSave(fixture, backend)).n1_reveal_id).toBe(reveal);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    click(fixture, 'Stop the exercise');
    expect((await flushSave(fixture, backend)).n1_reveal_id).toBe(reveal);
    const back = root(fixture).querySelector<HTMLAnchorElement>('a.primary-link');
    expect(back?.textContent?.trim()).toBe('Back to My experiment');
  });

  it('saves a stopped session as aborted', async () => {
    const { fixture, backend } = await begin({ mode: 'try', condition: 'action_bridge' });
    await flushSave(fixture, backend);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    click(fixture, 'Stop the exercise');
    const body = await flushSave(fixture, backend);
    expect(body.status).toBe('aborted');
    expect(body.steps?.at(-1)).toMatchObject({ step: 'stopped', result: { during: 'pre_rating' } });
    expect(root(fixture).textContent).toContain('Exercise stopped');
    expect(root(fixture).textContent).toContain('What you did so far is saved.');
  });

  it('shows a retry option when the final save fails', async () => {
    const { fixture, backend } = await begin({ mode: 'try', condition: 'action_bridge' });
    await flushSave(fixture, backend);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    click(fixture, 'Stop the exercise');
    await settle(fixture);
    backend
      .expectOne((r) => r.method === 'PUT')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    await settle(fixture);
    expect(root(fixture).querySelector('[role="alert"]')?.textContent).toContain("couldn't be saved");

    click(fixture, 'Try again');
    expect((await flushSave(fixture, backend)).status).toBe('aborted');
  });
});
