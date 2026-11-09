import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

import { Health } from '../api/types';
import { exerciseAvailable, notInBooth } from './access';

const STANDARD = { status: 'ok', database: 'ok', profile: 'standard', booth: null } as const;

function run(guard: typeof exerciseAvailable, health: Partial<Health> | null, condition?: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  const route = { queryParamMap: convertToParamMap(condition ? { condition } : {}) } as ActivatedRouteSnapshot;
  const result = TestBed.runInInjectionContext(() => guard(route, {} as RouterStateSnapshot));
  if (result === true) return Promise.resolve('open');
  const answer = firstValueFrom(result as Observable<boolean | UrlTree>).then((r) =>
    r === true ? 'open' : (r as UrlTree).toString(),
  );
  const req = TestBed.inject(HttpTestingController).expectOne('/api/health');
  if (health) req.flush(health);
  else req.flush('down', { status: 503, statusText: 'Unavailable' });
  return answer;
}

describe('access (M1)', () => {
  it('opens a development-only exercise in the development build only', async () => {
    expect(await run(exerciseAvailable, { ...STANDARD, environment: 'development' }, 'mcii')).toBe('open');
    expect(await run(exerciseAvailable, { ...STANDARD, environment: 'production' }, 'mcii')).toBe('/not-available');
    expect(await run(exerciseAvailable, null, 'mcii')).toBe('/not-available');
    expect(await run(exerciseAvailable, { ...STANDARD, environment: 'production' }, 'action_bridge')).toBe('open');
  });

  it('opens in a booth only what is rated safe for unsupervised use', async () => {
    const booth = (exercises: string[]) => ({
      status: 'ok' as const,
      database: 'ok' as const,
      environment: 'production' as const,
      profile: 'booth' as const,
      booth: { support_line: 'x', idle_seconds: 180, exercises: exercises as never[] },
    });
    expect(await run(exerciseAvailable, booth([]), 'action_bridge')).toBe('/not-available');
    expect(await run(exerciseAvailable, booth(['goal_restatement']), 'goal_restatement')).toBe('open');
  });

  it('leaves an incomplete link to the page, which says so', async () => {
    expect(await run(exerciseAvailable, null)).toBe('open');
  });

  it('never opens records, the experiment or the Lab in a booth', async () => {
    expect(await run(notInBooth, { ...STANDARD, environment: 'production' })).toBe('open');
    const booth = { status: 'ok', database: 'ok', environment: 'production', profile: 'booth' } as const;
    expect(await run(notInBooth, { ...booth, booth: { support_line: 'x', idle_seconds: 180, exercises: [] } })).toBe(
      '/not-available',
    );
  });
});
