import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { StartPage } from './start-page';

describe('StartPage', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StartPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('reports a reachable API', async () => {
    const fixture = TestBed.createComponent(StartPage);
    fixture.detectChanges();
    backend.expectOne('/api/health').flush({ status: 'ok', database: 'ok' });
    await fixture.whenStable();
    const status = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.getAttribute('data-status')).toBe('ok');
  });

  it('reports an unreachable API and keeps Start disabled', async () => {
    const fixture = TestBed.createComponent(StartPage);
    fixture.detectChanges();
    backend.expectOne('/api/health').flush(null, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="status"]')?.getAttribute('data-status')).toBe('unavailable');
    root.querySelector<HTMLInputElement>('input[value="action_bridge"]')!.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });

  it('starts a development session with the chosen condition', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(StartPage);
    fixture.detectChanges();
    backend.expectOne('/api/health').flush({ status: 'ok', database: 'ok' });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[name="mode"]')).toBeNull(); // always dev mode here
    root.querySelector<HTMLInputElement>('input[value="state_reset+action_bridge"]')!.click();
    await fixture.whenStable();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    expect(navigate).toHaveBeenCalledWith(['/session'], {
      queryParams: { mode: 'dev', condition: 'state_reset+action_bridge' },
    });
  });
});
