import { TestBed } from '@angular/core/testing';

import { scienceFor } from '../../content';
import { ScienceSection } from './science-section';

async function render(experience: string, method: string, open = false) {
  TestBed.configureTestingModule({ imports: [ScienceSection] });
  const fixture = TestBed.createComponent(ScienceSection);
  fixture.componentRef.setInput('science', scienceFor(experience)!);
  fixture.componentRef.setInput('method', method);
  fixture.componentRef.setInput('open', open);
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).querySelector('details')!;
}

describe('ScienceSection', () => {
  it('is collapsed by default and names the method in its bar', async () => {
    const details = await render('action_bridge', 'Implementation intentions');
    expect(details.open).toBe(false);
    expect(details.querySelector('summary .title')?.textContent).toBe('Why this exercise?');
    expect(details.querySelector('summary .subtitle')?.textContent).toBe(
      'The science behind it: Implementation intentions',
    );
  });

  it('shows every part under its own heading, in the standard order', async () => {
    const details = await render('action_bridge', 'Implementation intentions', true);
    const headings = Array.from(details.querySelectorAll('h3')).map((h) => h.textContent!.trim());
    expect(headings).toEqual([
      'What you do',
      'The method: If-then planning (implementation intentions)',
      'What research says about this method',
      'About this exercise',
      'Limits',
      'Sources',
    ]);
    expect(details.querySelectorAll('.finding')).toHaveLength(2);
    expect(details.querySelector('.callout')?.textContent).toContain("hasn't been tested itself");
    expect(details.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps each evidence qualification next to its finding and source', async () => {
    const details = await render('game_only+action_bridge', 'Distraction', true);
    const ref = details.querySelector('.finding .refs li')!;
    expect(ref.textContent).toContain('Webb, Miles & Sheeran, 2012');
    expect(ref.querySelector('.level')?.textContent).toBe('Summary checked; full text not yet');
    const source = details.querySelector('.sources li')!;
    expect(source.textContent).toContain('(summary checked; full text not yet)');
    expect(source.querySelector('a')?.getAttribute('rel')).toContain('noopener');
    expect(source.querySelector('a')?.textContent).toContain('(opens in a new tab)');
  });

  it('shows each paragraph of a multi-paragraph text as its own paragraph', async () => {
    const details = await render('state_reset+action_bridge', 'Working-memory taxation', true);
    const method = details.querySelectorAll('section.part')[1];
    expect(method.querySelectorAll('p')).toHaveLength(3);
  });

  it('labels fully checked sources as such', async () => {
    const details = await render('state_reset+action_bridge', 'Working-memory taxation', true);
    const levels = Array.from(details.querySelectorAll('.level')).map((l) => l.textContent);
    expect(levels).toEqual(['Full text checked', 'Full text checked']);
  });
});
