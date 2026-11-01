import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AREAS } from '../../areas';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('presents every area, with only available ones as links', async () => {
    const fixture = TestBed.createComponent(HomePage);
    backend.expectOne('/api/n1/today').flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const cards = Array.from(root.querySelectorAll('.areas > li'));
    expect(cards.map((c) => c.querySelector('h3')?.textContent?.trim())).toEqual(AREAS.map((a) => a.title));

    const available = cards.filter((c) => c.querySelector('a'));
    expect(available.map((c) => c.querySelector('h3')?.textContent?.trim())).toEqual(['Action and growth']);
    expect(root.querySelectorAll('.badge:not(.available)').length).toBe(AREAS.length); // 6 areas + the guide
    expect(root.textContent).toContain('A conversation guide (optional)');
    // Without the API there is no experiment callout, but Home still works.
    expect(root.textContent).not.toContain('Open My experiment');
  });

  it("shows the experiment callout with today's line", async () => {
    const fixture = TestBed.createComponent(HomePage);
    backend.expectOne('/api/n1/today').flush({ status: 'pending', plan: { planned_start: '19:00' } });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Today: planned for 19:00.');
  });
});
