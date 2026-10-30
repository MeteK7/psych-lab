import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { N1Today } from '../../api/types';
import { TodayPage } from './today-page';

const base: N1Today = {
  phase: 1,
  test_phase: false,
  session_mode: 'self_use',
  timezone: 'Europe/Istanbul',
  today: '2026-11-02',
  status: 'pending',
  plan: { planned_start: '19:00', barrier: null, barrier_late: null },
  reveal: null,
  session: null,
  study_start_target: null,
  study_start: null,
  tomorrow: '2026-11-03',
  tomorrow_plan: null,
  can_start_session: true,
  can_report_barrier: true,
  barrier_would_be_late: false,
};

const revealed: N1Today = {
  ...base,
  status: 'revealed',
  reveal: {
    id: 'r-1',
    condition: 'goal_restatement',
    revealed_at: '2026-11-02T16:05:00Z',
    minutes_after_planned: 5,
    late_start: false,
  },
  can_report_barrier: false,
};

describe('TodayPage', () => {
  let backend: HttpTestingController;
  let fixture: ComponentFixture<TodayPage>;

  async function load(view: N1Today): Promise<HTMLElement> {
    fixture = TestBed.createComponent(TodayPage);
    backend.expectOne('/api/n1/today').flush(view);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function button(root: HTMLElement, text: string): HTMLButtonElement {
    const found = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.trim().startsWith(text),
    );
    if (!found) throw new Error(`No button "${text}"`);
    return found;
  }

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodayPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('reveals the slot and opens the session with the assigned condition', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const root = await load(base);
    expect(root.textContent).toContain('Planned start: 19:00');

    button(root, "Start today's session").click();
    const req = backend.expectOne('/api/n1/reveal');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({}); // JSON body, as the API requires
    req.flush(revealed);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/session'], {
      queryParams: { mode: 'self_use', condition: 'goal_restatement', reveal: 'r-1' },
    });
  });

  it('offers to continue an unfinished session without a new reveal', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const root = await load(revealed);
    button(root, "Continue today's session").click();
    backend.expectNone('/api/n1/reveal');
    expect(navigate).toHaveBeenCalled();
  });

  it('shows the study-start box first and prominently after a session', async () => {
    const root = await load({
      ...base,
      status: 'session',
      session: { id: 's-1', status: 'completed' },
      reveal: revealed.reveal,
      can_start_session: false,
      can_report_barrier: false,
      study_start_target: { session_date: '2026-11-02', window_from: '2026-11-02T16:20:00Z' },
    });
    const first = root.querySelector('section');
    expect(first?.classList).toContain('prominent');
    expect(first?.textContent).toContain('Starting to study?');

    type(first!.querySelector('input')!, 'worked example 1');
    await fixture.whenStable();
    button(root, "I'm starting now").click();
    const req = backend.expectOne('/api/n1/study-start');
    expect(req.request.body).toEqual({ text: 'worked example 1' });
    req.flush({
      ...base,
      status: 'session',
      can_start_session: false,
      can_report_barrier: false,
      study_start: { session_date: '2026-11-02', recorded_at: '2026-11-02T16:25:00Z' },
    });
    await fixture.whenStable();
    expect(root.querySelector('.prominent')).toBeNull();
    expect(root.textContent).toContain('Study start recorded at');
  });

  it('warns that a barrier after the planned start is recorded as late', async () => {
    const root = await load({ ...base, barrier_would_be_late: true });
    expect(root.querySelector('.barrier .warning')?.textContent).toContain('recorded as late');

    type(root.querySelector<HTMLInputElement>('.barrier input')!, 'visitors');
    await fixture.whenStable();
    button(root, 'Record barrier').click();
    const req = backend.expectOne('/api/n1/barrier');
    expect(req.request.body).toEqual({ reason: 'visitors' });
    req.flush({
      ...base,
      status: 'late_barrier',
      plan: { planned_start: '19:00', barrier: 'visitors', barrier_late: true },
      can_start_session: false,
      can_report_barrier: false,
    });
    await fixture.whenStable();
    expect(root.textContent).toContain('counts as a study day without a session');
    expect(root.textContent).not.toContain("Start today's session");
  });

  it('plans tomorrow', async () => {
    const root = await load(base);
    type(root.querySelector<HTMLInputElement>('input[type="time"]')!, '20:30');
    await fixture.whenStable();
    button(root, 'Save plan').click();
    const req = backend.expectOne('/api/n1/days/2026-11-03');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ planned_start: '20:30' });
    req.flush({ ...base, tomorrow_plan: { planned_start: '20:30' } });
    await fixture.whenStable();
    expect(root.textContent).toContain('Planned for 20:30.');
  });

  it('shows the API message when an action is refused', async () => {
    const root = await load(base);
    button(root, "Start today's session").click();
    backend
      .expectOne('/api/n1/reveal')
      .flush({ detail: 'Only days planned the evening before can have a session.' }, {
        status: 409,
        statusText: 'Conflict',
      });
    await fixture.whenStable();
    expect(root.querySelector('.error')?.textContent).toContain('planned the evening before');
  });

  it('marks the test phase clearly', async () => {
    const root = await load({ ...base, phase: 0, test_phase: true, session_mode: 'dev' });
    expect(root.querySelector('.test-banner')?.textContent).toContain('Test phase 0');
  });
});
