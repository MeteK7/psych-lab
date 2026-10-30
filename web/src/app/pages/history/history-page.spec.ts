import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SessionOut } from '../../api/types';
import { HistoryPage } from './history-page';

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
  n1_reveal_id: null,
  created_at: '2026-10-29T18:00:00Z',
  updated_at: '2026-10-29T18:05:00Z',
};

describe('HistoryPage', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists sessions returned by the API', async () => {
    const fixture = TestBed.createComponent(HistoryPage);
    backend.expectOne('/api/sessions').flush([
      { ...session, followup: { self_reported_minutes: 40, recorded_at: '2026-10-29T21:00:00Z' } },
    ]);
    await fixture.whenStable();
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('action_bridge');
    expect(rows[0].textContent).toContain('40');
  });

  it('shows an alert when the API is unreachable', async () => {
    const fixture = TestBed.createComponent(HistoryPage);
    backend.expectOne('/api/sessions').flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('could not be loaded');
  });

  it('records an end-of-day follow-up for a completed session', async () => {
    const fixture = TestBed.createComponent(HistoryPage);
    backend.expectOne('/api/sessions').flush([session]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('button[aria-expanded]')!.click();
    await fixture.whenStable();
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
    expect(root.querySelector('tbody tr')?.textContent).toContain('45');
    expect(root.querySelector('app-follow-up-form')).toBeNull();
  });
});
