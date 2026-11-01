import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SessionOut } from '../../api/types';
import { RecordsPage } from './records-page';

const session: SessionOut = {
  id: '6f1c5c1e-0000-4000-8000-000000000001',
  mode: 'self_use',
  condition: 'action_bridge',
  status: 'completed',
  content_versions: {},
  steps: [],
  plan: null,
  ratings: null,
  followup: null,
  started_at: '2026-10-29T18:00:00Z',
  ended_at: '2026-10-29T18:05:00Z',
  n1_reveal_id: '11111111-2222-4333-8444-555555555555',
  created_at: '2026-10-29T18:00:00Z',
  updated_at: '2026-10-29T18:05:00Z',
};

describe('RecordsPage', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RecordsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists exercises by on-screen name, type and result', async () => {
    const fixture = TestBed.createComponent(RecordsPage);
    backend.expectOne('/api/sessions').flush([
      { ...session, followup: { self_reported_minutes: 40, recorded_at: '2026-10-29T21:00:00Z' } },
      { ...session, id: 'p', mode: 'dev', condition: 'game_only+action_bridge', status: 'aborted', n1_reveal_id: null },
      { ...session, id: 't', mode: 'dev', status: 'in_progress' },
    ]);
    await fixture.whenStable();
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'));
    // Every column except the date, which depends on the local time zone.
    const cells = rows.map((r) =>
      Array.from(r.querySelectorAll('td')).slice(1).map((td) => td.textContent?.replace(/\s+/g, ' ').trim()),
    );
    expect(cells).toEqual([
      ['Plan your first step', 'Experiment', 'Completed', '40 min'],
      ['Follow the dot, then plan', 'Practice', 'Stopped', '–'],
      ['Plan your first step', 'Test', 'Not finished', 'Add follow-up'],
    ]);
  });

  it('offers a follow-up only for experiment exercises', async () => {
    const fixture = TestBed.createComponent(RecordsPage);
    backend.expectOne('/api/sessions').flush([{ ...session, mode: 'dev', n1_reveal_id: null }]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('button[aria-expanded]')).toBeNull();
  });

  it('shows an alert when the API is unreachable', async () => {
    const fixture = TestBed.createComponent(RecordsPage);
    backend.expectOne('/api/sessions').flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('could not be loaded');
  });

  it('records an end-of-day follow-up for an experiment exercise', async () => {
    const fixture = TestBed.createComponent(RecordsPage);
    backend.expectOne('/api/sessions').flush([session]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('button[aria-expanded]')!.click();
    await fixture.whenStable();
    expect(root.textContent).toContain('About how many minutes did you spend learning');
    const minutes = root.querySelector<HTMLInputElement>('input[type="number"]')!;
    minutes.value = '45';
    minutes.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    root.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();

    const req = backend.expectOne(`/api/sessions/${session.id}/follow-up`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ self_reported_minutes: 45, burden: null, note: null });
    req.flush({ ...session, followup: { self_reported_minutes: 45, recorded_at: '2026-10-30T21:00:00Z' } });
    await fixture.whenStable();
    expect(root.querySelector('tbody tr')?.textContent).toContain('45 min');
    expect(root.querySelector('app-follow-up-form')).toBeNull();
  });
});
