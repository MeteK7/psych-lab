import { TestBed } from '@angular/core/testing';

import { buildFrame } from '../integration/pipeline';
import { SCENES } from '../scenes';
import { readSource } from '../testing/source-files';
import { ResolvedFrame } from './frame';
import { SvgBackend, pathData } from './svg/svg-backend';

/**
 * The backend conformance suite (docs/visual-system.md §6.2), run for every backend. With one
 * backend so far, it checks the SVG backend against the resolved frame for every scene × state.
 * Motion checks (reduced motion gives the final state with nothing running) join when a
 * composition pulls motion; until then no backend plays anything.
 */
async function render(frame: ResolvedFrame, scheme: 'auto' | 'light' | 'dark' = 'auto') {
  TestBed.configureTestingModule({ imports: [SvgBackend] });
  const fixture = TestBed.createComponent(SvgBackend);
  fixture.componentRef.setInput('frame', frame);
  fixture.componentRef.setInput('scheme', scheme);
  await fixture.whenStable();
  return fixture;
}

const CASES = SCENES.flatMap(({ scene, text }) => Object.keys(scene.states.states).map((state) => ({ scene, text, state })));

describe('SVG backend conformance', () => {
  for (const { scene, text, state } of CASES) {
    it(`draws ${scene.id} in state ${state}: the frame's items, in order, and nothing else`, async () => {
      const frame = buildFrame(scene, state, text);
      const fixture = await render(frame);
      const host = fixture.nativeElement as HTMLElement;
      const drawn = [...host.querySelectorAll('[data-vis-id]')];
      expect(drawn.map((e) => e.getAttribute('data-vis-id'))).toEqual(frame.items.map((i) => i.id));
      for (const item of frame.items) {
        const el = host.querySelector(`[data-vis-id="${item.id}"]`)!;
        if (item.kind === 'text') expect(el.textContent?.trim()).toBe(item.text);
        else expect(el.getAttribute('d')).toBe(pathData(item.shape));
      }
      expect(host.querySelectorAll('svg *').length).toBe(frame.items.length);
    });
  }

  it('hides the drawing from assistive technology; the slot carries the text alternative', async () => {
    const { scene, text } = SCENES[0];
    const host = (await render(buildFrame(scene, scene.states.initial, text))).nativeElement as HTMLElement;
    const svg = host.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('viewBox')).toBe('0 0 480 120');
  });

  it('takes colours only from S1 tokens, never literal values', async () => {
    for (const { scene, text, state } of CASES) {
      for (const item of buildFrame(scene, state, text).items) {
        const colours = item.kind === 'text' ? [item.fill] : [item.paint.fill, item.paint.stroke];
        for (const c of colours) expect(c, `${scene.id}/${item.id}`).toMatch(/^(none|var\(--vis-[\w-]+(, var\(--vis-[\w-]+\))?\))$/);
      }
    }
  });

  it('marks its theme and scheme for the tokens', async () => {
    const { scene, text } = SCENES[0];
    const host = (await render(buildFrame(scene, scene.states.initial, text), 'dark')).nativeElement as HTMLElement;
    expect(host.getAttribute('data-vis-theme')).toBe(scene.theme);
    expect(host.getAttribute('data-vis-scheme')).toBe('dark');
  });

  it('stays idle when nothing changes: no frame loops or timers of its own', async () => {
    // jsdom's animation-frame shim uses timers itself, so this is checked on the source.
    const code = await readSource('src/app/shared/visual/rendering/svg/svg-backend.ts');
    expect(code).not.toMatch(/requestAnimationFrame|setInterval|setTimeout/);
  });

  it('destroys cleanly', async () => {
    const { scene, text } = SCENES[0];
    const fixture = await render(buildFrame(scene, scene.states.initial, text));
    fixture.destroy();
    expect(fixture.componentRef.hostView.destroyed).toBe(true);
  });
});

describe('pathData', () => {
  it('draws every drawable as path data', () => {
    expect(pathData({ type: 'line', x1: 0, y1: 1, x2: 2, y2: 3 })).toBe('M0 1 L2 3');
    expect(pathData({ type: 'rect', x: 0, y: 0, width: 4, height: 2 })).toBe('M0 0 H4 V2 H0 Z');
    expect(pathData({ type: 'circle', cx: 5, cy: 5, r: 2 })).toBe('M3 5 A2 2 0 1 0 7 5 A2 2 0 1 0 3 5 Z');
    expect(pathData({ type: 'rect', x: 0, y: 0, width: 10, height: 10, rx: 2 })).toContain('A2 2 0 0 1');
  });
});
