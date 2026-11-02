import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AreaPage } from './area-page';

/** Opens an area page; the server reports which build is running. */
function create(id: string, environment: 'development' | 'production' = 'production') {
  TestBed.configureTestingModule({
    imports: [AreaPage],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
    ],
  });
  const fixture = TestBed.createComponent(AreaPage);
  TestBed.inject(HttpTestingController)
    .expectOne('/api/health')
    .flush({ status: 'ok', database: 'ok', environment });
  return fixture;
}

describe('AreaPage', () => {
  it('lists the topic experiences by on-screen name and marks the experimental one', async () => {
    const fixture = create('action-growth');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const names = Array.from(root.querySelectorAll('.experiences h3')).map((h) => h.textContent?.trim());
    expect(names).toEqual([
      'Plan your first step',
      'Write down your goal',
      'Picture it, then follow the dot',
      'Follow the dot, then plan',
    ]);
    expect(root.querySelectorAll('.experiences .badge')).toHaveLength(1);
    expect(root.textContent).toContain('Getting started on learning');
    expect(root.textContent).toContain('never part of your experiment');
  });

  it('starts "Try it" as practice, never as an experiment exercise', async () => {
    const fixture = create('action-growth');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.experiences button')!.click();
    expect(navigate).toHaveBeenCalledWith(['/session'], {
      queryParams: { mode: 'try', condition: 'action_bridge' },
    });
  });

  it('names each card\'s method, linking to its explanation in practice mode', async () => {
    const fixture = create('action-growth');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.experiences a.method'));
    const names = links.map((a) => a.textContent!.split(':')[0].trim());
    expect(names).toEqual([
      'Implementation intentions',
      'Goal intentions',
      'Working-memory taxation',
      'Distraction',
    ]);
    expect(root.textContent).not.toContain('Why this exercise?'); // no repeated links
    expect(links[2].querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(links[2].textContent).toContain(': the science behind Picture it, then follow the dot');
    const url = new URL(links[2].href);
    expect(url.pathname).toBe('/session');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      mode: 'try',
      condition: 'state_reset+action_bridge',
      why: '1',
    });
  });

  it('says so when the area does not exist', async () => {
    const fixture = create('attention'); // planned, so there is no page
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Area not found');
  });

  describe('Cognitive shifts (development only)', () => {
    it('lists its three exercises with their methods and fixed durations in the development build', async () => {
      const fixture = create('cognitive-shifts', 'development');
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const cards = Array.from(root.querySelectorAll('.experiences .card'));
      expect(cards.map((c) => c.querySelector('h3')?.textContent?.trim())).toEqual([
        'Other ways to read it',
        'Why did it happen?',
        'Not enough to go on',
      ]);
      expect(cards.map((c) => c.querySelector('a.method')?.textContent?.split(':')[0].trim())).toEqual([
        'Reappraisal',
        'Attributional reframing',
        'Perspective-getting',
      ]);
      expect(cards.map((c) => /About (\d+) minutes/.exec(c.textContent ?? '')?.[1])).toEqual(['5', '5', '4']);
      expect(root.textContent).toContain('without anything you write');
      expect(root.textContent).not.toContain('Open My experiment');
      const ids = Array.from(root.querySelectorAll('h2[id]')).map((h) => h.id);
      expect(new Set(ids).size).toBe(ids.length); // one heading id per topic
    });

    it('is not found in the production build', async () => {
      const fixture = create('cognitive-shifts', 'production');
      await fixture.whenStable();
      expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Area not found');
    });
  });
});
