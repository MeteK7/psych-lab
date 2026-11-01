import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AreaPage } from './area-page';

function create(id: string) {
  TestBed.configureTestingModule({
    imports: [AreaPage],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
    ],
  });
  return TestBed.createComponent(AreaPage);
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

  it('links each card to its "Why this exercise?" explanation in practice mode', async () => {
    const fixture = create('action-growth');
    await fixture.whenStable();
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.card-actions a'),
    );
    expect(links).toHaveLength(4);
    expect(links[2].textContent).toContain('Why this exercise?');
    expect(links[2].textContent).toContain('(Picture it, then follow the dot)'); // for screen readers
    const url = new URL(links[2].href);
    expect(url.pathname).toBe('/session');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      mode: 'try',
      condition: 'state_reset+action_bridge',
      why: '1',
    });
  });

  it('says so when the area does not exist', async () => {
    const fixture = create('cognitive-shifts'); // planned, so there is no page
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Area not found');
  });
});
