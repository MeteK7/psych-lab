import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { SessionUpsert } from '../../api/types';
import { SessionPage } from '../../flow/session-page';

// The three Cognitive shifts exercises, run through the session page as a person would.
// Everything a person writes is marked PRIVATE and must never appear in a saved record.

interface Run {
  fixture: ComponentFixture<SessionPage>;
  backend: HttpTestingController;
  bodies: SessionUpsert[];
}

function start(condition: string, mode = 'try', reveal?: string): Run {
  TestBed.configureTestingModule({
    imports: [SessionPage],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap({ mode, condition, ...(reveal ? { reveal } : {}) }) } },
      },
    ],
  });
  const fixture = TestBed.createComponent(SessionPage);
  return { fixture, backend: TestBed.inject(HttpTestingController), bodies: [] };
}

const root = (run: Run) => run.fixture.nativeElement as HTMLElement;

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

function button(run: Run, text: string): HTMLButtonElement {
  const found = Array.from(root(run).querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`No button "${text}"`);
  return found;
}

async function press(run: Run, text: string): Promise<void> {
  expect(button(run, text).disabled, `"${text}" is enabled`).toBe(false);
  button(run, text).click();
  await settle(run);
}

async function type(run: Run, input: HTMLInputElement, value: string): Promise<void> {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await run.fixture.whenStable();
}

async function check(run: Run, input: HTMLInputElement | null): Promise<void> {
  if (!input) throw new Error('No such option');
  input.click();
  await run.fixture.whenStable();
}

async function rate(run: Run, value: number): Promise<void> {
  for (const scale of Array.from(root(run).querySelectorAll('app-rating-scale fieldset'))) {
    scale.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click();
  }
  await run.fixture.whenStable();
}

async function slide(run: Run, input: HTMLInputElement, value: number): Promise<void> {
  input.value = String(value);
  input.dispatchEvent(new Event('input'));
  await run.fixture.whenStable();
}

const heading = (run: Run) => root(run).querySelector('h2.progress')?.textContent?.trim();
const last = (run: Run) => run.bodies[run.bodies.length - 1];

describe('Cognitive shifts exercises', () => {
  afterEach(() => vi.restoreAllMocks());

  it('CS1 runs through its six screens, keeps own text private, and suggests a plan when it can be acted on', async () => {
    const run = start('cs_other_readings');
    await run.fixture.whenStable();
    expect(root(run).textContent).toContain('About 5 minutes.');
    await press(run, 'Begin');

    expect(heading(run)).toBe('Step 1 of 6: Your first reading');
    expect(root(run).textContent).toContain("They aren't for painful experiences");
    // "My own reading" is the last option; choosing it opens the field.
    expect(root(run).querySelector('app-card-pick legend')?.textContent).toBe(
      "What does it seem to say? Pick the reading that's closest, or write your own:",
    );
    const options = Array.from(root(run).querySelectorAll('app-card-pick .card-option')).map((o) => o.textContent?.trim());
    expect(options.at(-1)).toBe('My own reading');
    expect(root(run).querySelector('app-card-pick .own')).toBeNull();
    await check(run, root(run).querySelector('app-card-pick input[value="own"]'));
    expect(root(run).querySelector('app-card-pick .own span')?.textContent).toBe(
      "Write it in a few words (only you see this; it isn't saved)",
    );
    await type(run, root(run).querySelector<HTMLInputElement>('.own input')!, 'PRIVATE first reading');
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 2 of 6: How it feels now');
    expect(root(run).textContent).toContain('Your first reading: “PRIVATE first reading”');
    await rate(run, 7);
    await check(run, root(run).querySelector('input[name="cs1-control"][value="yes"]'));
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 3 of 6: Other ways to see it');
    expect(root(run).textContent).toContain('Lens 1 of 3: Other explanations');
    expect(root(run).querySelector('.lead')).toBeNull();
    await check(run, root(run).querySelector('app-card-pick input[type="radio"]'));
    await press(run, 'Next lens');
    expect(root(run).textContent).toContain("Lens 2 of 3: A friend's view");
    // The friend's perspective is set up before the question, so it can't read as feedback on an answer.
    const lead = Array.from(root(run).querySelectorAll('.lead'));
    expect(lead.map((p) => p.textContent)).toEqual([
      "Let's switch the perspective for a moment.",
      "Imagine a friend telling you they're experiencing the same everyday situation you described in Step 1 and interpreting it in exactly the same way you do.",
      'You might start by telling them:',
      "“It makes sense that this bothers you. That isn't something you need to talk yourself out of.”",
    ]);
    const pickArea = root(run).querySelector('app-card-pick')!;
    expect(lead.every((p) => p.compareDocumentPosition(pickArea) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(pickArea.querySelector('legend')?.textContent).toBe('What else would you say to them?');
    expect(pickArea.querySelectorAll('input[type="radio"]')).toHaveLength(5); // 4 cards and "my own"
    await press(run, 'Nothing comes to mind');
    expect(root(run).querySelector('.lead')).toBeNull();
    expect(root(run).querySelector('app-card-pick .own')).toBeNull(); // a new lens starts closed
    await check(run, root(run).querySelector('app-card-pick input[value="own"]'));
    await type(run, root(run).querySelector<HTMLInputElement>('.own input')!, 'PRIVATE lens reading');
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 4 of 6: Which readings fit?');
    expect(button(run, 'Next').disabled).toBe(true); // every reading placed first
    await check(run, root(run).querySelector('#place-first-fits'));
    await check(run, root(run).querySelector('#place-explain-partly'));
    await check(run, root(run).querySelector('#place-later-fits'));
    await press(run, 'Next');

    await rate(run, 4);
    await press(run, 'Next');
    expect(heading(run)).toBe("Step 6 of 6: What you're keeping");
    const close = root(run).textContent!;
    expect(close).toContain('It still feels like it fits.'); // own reading: acknowledged, not endorsed
    expect(close).not.toContain('sometimes the first reading is right');
    expect(close).toContain('planning a step might help more');
    await press(run, 'Finish');

    expect(root(run).textContent).toContain('Exercise complete');
    const plan = Array.from(root(run).querySelectorAll('a')).find((a) => a.textContent?.trim() === 'Plan your first step');
    expect(plan?.getAttribute('href')).toBe('/session?mode=try&condition=action_bridge');
    const back = Array.from(root(run).querySelectorAll('a')).find((a) => a.textContent?.includes('Back to'));
    expect(back?.textContent?.trim()).toBe('Back to Cognitive shifts');
    expect(back?.getAttribute('href')).toBe('/areas/cognitive-shifts');

    const saved = last(run);
    expect(saved.status).toBe('completed');
    expect(saved.mode).toBe('try');
    expect(saved.content_versions).toEqual({ 'cs-other-readings': '4' });
    expect(saved.steps?.map((s) => s.step)).toEqual([
      'cs1_first', 'cs1_feel_before', 'cs1_lenses', 'cs1_sort', 'cs1_feel_after', 'cs1_close',
    ]);
    expect(saved.ratings).toEqual({ cs1_belief_pre: 7, cs1_upset_pre: 7, cs1_belief_post: 4, cs1_upset_post: 4 });
    expect(saved.steps?.[2].result).toEqual({
      lenses: [
        { lens: 'explain', reading: 'harder' },
        { lens: 'friend', reading: null },
        { lens: 'later', reading: 'own' },
      ],
    });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('CS1 keeps "sometimes the first reading is right" for a reading of the situation', async () => {
    const run = start('cs_other_readings');
    await run.fixture.whenStable();
    await press(run, 'Begin');
    await check(run, root(run).querySelector('app-card-pick input[value="always"]'));
    await press(run, 'Next');
    await rate(run, 5);
    await check(run, root(run).querySelector('input[name="cs1-control"][value="no"]'));
    await press(run, 'Next');
    for (let i = 0; i < 3; i++) await press(run, 'Nothing comes to mind');
    await check(run, root(run).querySelector('#place-first-fits'));
    await press(run, 'Next');
    await rate(run, 5);
    await press(run, 'Next');
    const close = root(run).textContent!;
    expect(close).toContain('sometimes the first reading is right');
    expect(close).not.toContain('planning a step');
    await press(run, 'Finish');
    expect(Array.from(root(run).querySelectorAll('a')).map((a) => a.textContent?.trim())).not.toContain('Plan your first step');
  });

  it('CS2 maps causes, notes a heavy map, and never saves the setback or causes', async () => {
    const run = start('cs_why_it_happened');
    await run.fixture.whenStable();
    expect(root(run).textContent).toContain('About 5 minutes.');
    await press(run, 'Begin');

    expect(heading(run)).toBe('Step 1 of 6: The setback');
    await type(run, root(run).querySelector<HTMLInputElement>('input[type="text"]')!, 'PRIVATE setback');
    await press(run, 'Next');
    await check(run, root(run).querySelector('app-card-pick input[value="not_good"]'));
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 3 of 6: Other possible causes');
    const boxes = root(run).querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await check(run, boxes[0]);
    expect(button(run, 'Next').disabled).toBe(true); // at least three causes
    await type(run, root(run).querySelector<HTMLInputElement>('form.own input')!, 'PRIVATE cause');
    await press(run, 'Add');
    expect(root(run).textContent).toContain('3 causes so far.');
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 4 of 6: Place each cause');
    for (let i = 0; i < 3; i++) {
      for (const slider of Array.from(root(run).querySelectorAll<HTMLInputElement>('input[type="range"]'))) {
        await slide(run, slider, 1);
      }
      await press(run, i < 2 ? 'Next cause' : 'Next');
    }

    expect(heading(run)).toBe('Step 5 of 6: What the map shows');
    const map = root(run).textContent!;
    expect(map).toContain("That's a heavy way to see it.");
    expect(map).toContain("Effort is one possible cause among many. It isn't the answer by default.");
    expect(root(run).querySelector('figure svg[role="img"]')).not.toBeNull();
    expect(root(run).querySelectorAll('.map-list li')).toHaveLength(3);
    await check(run, root(run).querySelector('.add app-card-pick input[value="chance"]'));
    for (const slider of Array.from(root(run).querySelectorAll<HTMLInputElement>('.add input[type="range"]'))) {
      await slide(run, slider, 5);
    }
    await press(run, 'Add');
    expect(root(run).querySelectorAll('.map-list li')).toHaveLength(4);
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 6 of 6: Anything to change?');
    const options = Array.from(root(run).querySelectorAll('input[name="cs2-change"]'));
    expect(options[0].parentElement?.textContent?.trim()).toBe('Chance'); // changeable causes first
    await check(run, options[0] as HTMLInputElement);
    await press(run, 'Finish');

    const saved = last(run);
    expect(saved.status).toBe('completed');
    expect(saved.content_versions).toEqual({ 'cs-why-it-happened': '2' });
    expect(saved.steps?.[3].result).toEqual({
      positions: [
        { cause: 'not_good', who: 1, time: 1, scope: 1 },
        { cause: 'preparation', who: 1, time: 1, scope: 1 },
        { cause: 'own', who: 1, time: 1, scope: 1 },
      ],
    });
    expect(saved.steps?.[5].result).toEqual({ chosen: { cause: 'chance', who: 5, time: 5, scope: 5 } });
    expect(Array.from(root(run).querySelectorAll('a')).map((a) => a.textContent?.trim())).toContain('Plan your first step');
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('CS3 checks which readings the facts could fit, then asks how to find out, keeping own text private', async () => {
    const run = start('cs_not_enough_to_go_on');
    await run.fixture.whenStable();
    expect(root(run).textContent).toContain('About 4 minutes.');
    await press(run, 'Begin');

    expect(heading(run)).toBe('Step 1 of 5: An unclear situation');
    await check(run, root(run).querySelectorAll<HTMLInputElement>('input[name="cs3-situation"]')[1]);
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 2 of 5: Your first reading');
    await check(run, root(run).querySelector('app-card-pick input[value="bothered"]'));
    expect(root(run).querySelector('app-rating-scale legend')?.textContent).toBe(
      'How sure are you that this reading is right?',
    );
    await rate(run, 8);
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 3 of 5: Could these explain it?');
    // The facts of the moment sit next to the question, with the person's reading under them.
    const facts = root(run).querySelector('section.facts')!;
    expect(facts.querySelector('h3')?.textContent).toBe('What happened');
    expect(facts.textContent).toContain("A friend hasn't replied to your message for a day.");
    expect(facts.textContent).toContain('Your reading: “Something I said bothered them a bit.”');
    const boxes = Array.from(root(run).querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    expect(boxes).toHaveLength(5); // every other reading of the scenario, and "something I haven't thought of"
    expect(boxes.some((b) => b.checked)).toBe(false); // nothing is chosen in advance
    expect(root(run).querySelector('.note')).toBeNull(); // no verdict before the person has judged
    await check(run, boxes[0]); // They've got a lot going on right now.
    await check(run, boxes[3]); // They saw it at a bad moment and forgot.
    await type(run, root(run).querySelector<HTMLInputElement>('form.own input')!, 'PRIVATE other reading');
    await press(run, 'Add');
    await press(run, 'Done');
    const note = root(run).querySelector('.note')!.textContent!;
    expect(note).toContain('What happened could fit 4 readings, including yours.');
    expect(note).toContain('These are possibilities, not information.');
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 4 of 5: Can you find out?');
    expect(root(run).textContent).toContain("Thinking it through tells you what's possible, not what happened.");
    await check(run, root(run).querySelector('input[name="cs3-find"][value="ask"]'));
    expect(root(run).querySelector('.note')?.textContent).toContain('One way to ask without assuming your reading');
    await press(run, 'Next');

    expect(heading(run)).toBe('Step 5 of 5: Your first reading, looked at again');
    const reassess = root(run).textContent!;
    expect(reassess).toContain('In Step 2, this was your first reading: ‘Something I said bothered them a bit.’');
    expect(reassess).toContain("You've now checked other explanations against what happened.");
    expect(reassess).toContain("There's no right answer. A lower rating isn't automatically better, and staying just as sure is also valid.");
    expect(root(run).querySelector('app-rating-scale legend')?.textContent).toBe(
      'Thinking back to that first reading: how sure are you now that it was right?',
    );
    expect(Array.from(root(run).querySelectorAll('.keep li')).map((li) => li.textContent)).toEqual([
      'Would what happened also fit another reading?',
      'What would actually tell me, and is it worth finding out?',
    ]);
    // The comparison appears only after rating, in the same neutral words for any direction.
    const compared = () => root(run).querySelector('[role="status"]')?.textContent;
    expect(compared()).toBeUndefined();
    expect(button(run, 'Finish').disabled).toBe(true);
    await rate(run, 10);
    expect(compared()).toContain('In Step 2 you rated it 8. Now you rate it 10.');
    await rate(run, 8);
    expect(compared()).toContain('In Step 2 you rated it 8. Now you rate it 8.');
    await rate(run, 4);
    expect(compared()).toContain('In Step 2 you rated it 8. Now you rate it 4.');
    expect(compared()).toContain("It doesn't show whether the reading is right.");
    await press(run, 'Finish');
    const plan = Array.from(root(run).querySelectorAll('a')).find((a) => a.textContent?.trim() === 'Plan your first step');
    expect(plan?.getAttribute('href')).toBe('/session?mode=try&condition=action_bridge');

    const saved = last(run);
    expect(saved.status).toBe('completed');
    expect(saved.content_versions).toEqual({ 'cs-not-enough': '4' });
    expect(saved.ratings).toEqual({ cs3_certainty_pre: 8, cs3_certainty_post: 4 });
    expect(saved.steps?.[2].result).toEqual({ fits: ['busy', 'forgot'], own_added: true, something_else: false });
    expect(saved.steps?.[3].result).toEqual({ choice: 'ask' });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('CS3 offers general readings for an own situation, and takes a lone first reading seriously', async () => {
    const run = start('cs_not_enough_to_go_on');
    await run.fixture.whenStable();
    await press(run, 'Begin');
    await check(run, Array.from(root(run).querySelectorAll<HTMLInputElement>('input[name="cs3-situation"]')).at(-1)!);
    await type(run, root(run).querySelector<HTMLInputElement>('input[type="text"]')!, 'PRIVATE situation');
    await press(run, 'Next');

    expect(root(run).querySelectorAll('app-card-pick .card-option')).toHaveLength(5); // 4 general readings and "my own"
    await check(run, root(run).querySelector('app-card-pick input[value="own"]'));
    await type(run, root(run).querySelector<HTMLInputElement>('.own input')!, 'PRIVATE first reading');
    await rate(run, 9);
    await press(run, 'Next');

    expect(root(run).querySelector('section.facts')?.textContent).toContain('PRIVATE situation'); // shown back, never saved
    await press(run, 'Done');
    expect(root(run).querySelector('.note')?.textContent).toContain('You think only your reading fits what happened.');
    await press(run, 'Next');

    await check(run, root(run).querySelector('input[name="cs3-find"][value="leave"]'));
    expect(root(run).querySelector('.note')?.textContent).toContain("Then the honest answer is: you don't know.");
    await press(run, 'Next');
    expect(root(run).textContent).toContain('In Step 2, this was your first reading: ‘PRIVATE first reading’'); // shown back, never saved
    await rate(run, 9);
    await press(run, 'Finish');
    expect(Array.from(root(run).querySelectorAll('a')).some((a) => a.textContent?.includes('Plan your first step'))).toBe(false);

    const saved = last(run);
    expect(saved.steps?.[2].result).toEqual({ fits: [], own_added: false, something_else: false });
    expect(JSON.stringify(run.bodies)).not.toContain('PRIVATE');
  });

  it('never opens outside Try it', async () => {
    for (const [mode, reveal] of [['self_use', 'x'], ['dev', 'x'], ['try', 'x']] as const) {
      const run = start('cs_other_readings', mode, reveal);
      await run.fixture.whenStable();
      expect(root(run).textContent).toContain('This exercise link is incomplete.');
      TestBed.resetTestingModule();
    }
  });
});
