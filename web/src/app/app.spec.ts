import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the main navigation and a main landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const links = Array.from(root.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Home', 'My experiment', 'My records']);
    expect(root.querySelector('footer')?.textContent).toContain('your data stays on this computer');
    expect(root.querySelector('main#main')).not.toBeNull();
  });

  async function badge(environment: 'development' | 'production' | null): Promise<string | null> {
    const fixture = TestBed.createComponent(App);
    const req = TestBed.inject(HttpTestingController).expectOne('/api/health');
    if (environment) req.flush({ status: 'ok', database: 'ok', environment });
    else req.flush('down', { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    const element = (fixture.nativeElement as HTMLElement).querySelector('.env-badge');
    return element?.textContent?.trim() ?? null;
  }

  it('marks the development build on every page', async () => {
    expect(await badge('development')).toBe('Development');
  });

  it('shows no badge in production or when the server is down', async () => {
    expect(await badge('production')).toBeNull();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    expect(await badge(null)).toBeNull();
  });
});
