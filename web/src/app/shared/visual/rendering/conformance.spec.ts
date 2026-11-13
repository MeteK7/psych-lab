import { TestBed } from '@angular/core/testing';

import { BAR_SETS, barsFigure, routeFigure, setFigure } from '../../../pages/lab/lab-motion-figures';
import { Composed, lookupOf } from '../composition/compose';
import { composeCauseMap } from '../instruments/cause-map/cause-map';
import { buildChangeTimeline, buildComposedFrame, buildFrame, buildTimeline } from '../integration/pipeline';
import { SCENES } from '../scenes';
import { readSource } from '../testing/source-files';
import { ResolvedFrame, ResolvedTimeline } from './frame';
import { FRAME_CLOCK, FrameClock } from './frame-clock';
import { SvgBackend, pathData } from './svg/svg-backend';

const causeMapFrame = (input: Parameters<typeof composeCauseMap>[0]) => buildComposedFrame(composeCauseMap(input));

/**
 * The backend conformance suite (docs/visual-system.md §6.2), run for every backend. With one
 * backend so far, it checks the SVG backend against the resolved frame for every scene × state,
 * and that it plays a timeline towards that frame, and nothing without one.
 */
async function render(frame: ResolvedFrame, scheme: 'auto' | 'light' | 'dark' = 'auto', timeline: ResolvedTimeline = []) {
  TestBed.configureTestingModule({ imports: [SvgBackend] });
  const fixture = TestBed.createComponent(SvgBackend);
  fixture.componentRef.setInput('frame', frame);
  fixture.componentRef.setInput('scheme', scheme);
  fixture.componentRef.setInput('timeline', timeline);
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

  it('draws a bold text item bold, and every other text in the normal weight', async () => {
    const frame = causeMapFrame({ causes: [{ who: 1, time: 1 }, { who: 1, time: 1 }], placing: 2, axes: { left: 'a', right: 'b', top: 'c', bottom: 'd' } });
    const host = (await render(frame)).nativeElement as HTMLElement;
    const weights = Object.fromEntries([...host.querySelectorAll('text')].map((t) => [t.getAttribute('data-vis-id'), (t as SVGElement).style.fontWeight]));
    expect(weights['mark-1-num-2']).toBe('700');
    expect(weights['mark-1-num-1']).toBe('');
    expect(weights['axis-left']).toBe('');
  });

  it('fills a gradient through its own definition, unique on the page, with token stops', async () => {
    const frame: ResolvedFrame = {
      width: 100,
      height: 100,
      theme: 'action',
      items: [
        {
          kind: 'shape',
          id: 'ball',
          layer: 'x',
          shape: { type: 'ellipse', cx: 50, cy: 50, rx: 30, ry: 20 },
          paint: {
            fill: 'var(--vis-subject-fill)',
            stroke: 'var(--vis-subject)',
            width: 2,
            dash: null,
            gradient: { type: 'linear', from: [0, 0], to: [1, 1], stops: [{ offset: 0, colour: 'var(--vis-subject-lit)' }, { offset: 1, colour: 'var(--vis-subject-shade)' }] },
          },
        },
      ],
    };
    const host = (await render(frame)).nativeElement as HTMLElement;
    const gradient = host.querySelector('linearGradient')!;
    expect(gradient).not.toBeNull();
    expect(host.querySelector('[data-vis-id="ball"]')?.getAttribute('style')).toContain(`url("#${gradient.id}")`);
    expect([...gradient.querySelectorAll('stop')].map((s) => s.getAttribute('style'))).toEqual([
      'stop-color: var(--vis-subject-lit);',
      'stop-color: var(--vis-subject-shade);',
    ]);
    TestBed.resetTestingModule();
    const second = (await render(frame)).nativeElement as HTMLElement;
    expect(second.querySelector('linearGradient')!.id).not.toBe(gradient.id);
  });

  it('lays grain over a fill as a repeating pattern of the frame’s tile, at its opacity', async () => {
    const frame: ResolvedFrame = {
      width: 100,
      height: 100,
      theme: 'action',
      grain: { tile: 64, d: 'M1 1a1 1 0 1 0 2 0a1 1 0 1 0 -2 0' },
      items: [
        {
          kind: 'shape',
          id: 'ground',
          layer: 'x',
          shape: { type: 'rect', x: 0, y: 50, width: 100, height: 50 },
          paint: { fill: 'var(--vis-near)', stroke: 'none', width: 0, dash: null, grain: 0.05 },
        },
      ],
    };
    const host = (await render(frame)).nativeElement as HTMLElement;
    const pattern = host.querySelector('pattern')!;
    expect(pattern.getAttribute('width')).toBe('64');
    const overlay = host.querySelector('[data-vis-grain="ground"]')!;
    expect(overlay.getAttribute('style')).toContain(`url("#${pattern.id}")`);
    expect(overlay.getAttribute('style')).toContain('opacity: 0.05');
  });

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

  it('stays idle when nothing changes: no timers, and frames only through the frame clock while a shape glides', async () => {
    // jsdom's animation-frame shim uses timers itself, so this is checked on the source; the frame
    // loop itself is checked with a test clock (M5, below).
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

describe('SVG backend conformance: type (M3 stage C)', () => {
  const text = (extra: object) =>
    ({ kind: 'text', id: 't', layer: 'l', text: 'one two three', x: 10, y: 20, anchor: 'start', fill: 'var(--vis-label)', size: 14, ...extra }) as const;
  const frame = (item: ReturnType<typeof text>): ResolvedFrame => ({ width: 200, height: 100, theme: 'action', items: [item] });

  it('draws wrapped lines as their own lines, each a line height below the one before', async () => {
    const host = (await render(frame(text({ lines: ['one two', 'three'], lineHeight: 16.8 })))).nativeElement as HTMLElement;
    const spans = [...host.querySelectorAll('text tspan')];
    expect(spans.map((s) => s.textContent)).toEqual(['one two', 'three']);
    expect(spans.map((s) => [s.getAttribute('x'), s.getAttribute('y')])).toEqual([['10', '20'], ['10', '36.8']]);
  });

  it('draws a single line as plain text, without a stroke', async () => {
    const plain = (await render(frame(text({})))).nativeElement as HTMLElement;
    expect(plain.querySelector('text')!.textContent).toBe('one two three');
    expect(plain.querySelectorAll('tspan')).toHaveLength(0);
    expect((plain.querySelector('text') as SVGElement).style.stroke).toBe('');
  });

  it('draws a halo as the text’s own stroke, in the given colour and width', async () => {
    const haloed = (await render(frame(text({ halo: { colour: 'var(--vis-ground)', width: 4 } })))).nativeElement as HTMLElement;
    const t = haloed.querySelector('text') as SVGElement;
    expect(t.style.stroke).toBe('var(--vis-ground)');
    expect(t.style.strokeWidth).toBe('4px');
  });
});

describe('SVG backend conformance: motion', () => {
  // jsdom has no Web Animations API, so the backend's calls are recorded instead.
  let calls: { target: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions; cancel: ReturnType<typeof vi.fn> }[] = [];
  beforeEach(() => {
    calls = [];
    Element.prototype.animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      const cancel = vi.fn();
      calls.push({ target: this, keyframes, options, cancel });
      return { cancel } as unknown as Animation;
    } as Element['animate'];
  });
  afterEach(() => delete (Element.prototype as Partial<Element>).animate);

  const CHANGES = SCENES.flatMap(({ scene, text }) => (scene.transitions ?? []).map(([from, to]) => ({ scene, text, from, to })));

  for (const { scene, text, from, to } of CHANGES) {
    it(`plays ${scene.id} ${from} → ${to} towards the frame, with every track on its element`, async () => {
      const frame = buildFrame(scene, to, text);
      const timeline = buildTimeline(scene, from, to, 'full');
      expect(timeline.length).toBeGreaterThan(0);
      const host = (await render(frame, 'auto', timeline)).nativeElement as HTMLElement;
      // The final state is drawn whatever plays: the same items as without motion.
      expect([...host.querySelectorAll('[data-vis-id]')].map((e) => e.getAttribute('data-vis-id'))).toEqual(frame.items.map((i) => i.id));
      expect(calls).toHaveLength(timeline.length);
      timeline.forEach((track, i) => {
        const attr = track.property === 'reveal' ? 'data-vis-mask' : 'data-vis-id';
        expect(calls[i].target.getAttribute(attr), `${track.id} ${track.property}`).toBe(track.id);
        expect(calls[i].options).toEqual({ delay: track.delay, duration: track.duration, easing: track.easing, fill: 'backwards' });
      });
    });
  }

  it('draws a reveal through a mask on the element, ending fully drawn', async () => {
    const { scene, text } = SCENES[0];
    const timeline = buildTimeline(scene, 'contrast', 'plan', 'full');
    const host = (await render(buildFrame(scene, 'plan', text), 'auto', timeline)).nativeElement as HTMLElement;
    const bridge = host.querySelector('[data-vis-id="bridge"]')!;
    const mask = host.querySelector('mask')!;
    expect(bridge.getAttribute('mask')).toBe(`url(#${mask.id})`);
    expect(mask.querySelector('[data-vis-mask="bridge"]')?.getAttribute('stroke-dashoffset')).toBe('0');
    expect(calls.find((c) => c.target.getAttribute('data-vis-mask') === 'bridge')?.keyframes).toEqual([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }]);
  });

  it('plays nothing and adds nothing without a timeline (reduced and static tiers)', async () => {
    const { scene, text } = SCENES[0];
    const frame = buildFrame(scene, 'plan', text);
    const host = (await render(frame, 'auto', buildTimeline(scene, 'contrast', 'plan', 'reduced'))).nativeElement as HTMLElement;
    expect(calls).toEqual([]);
    expect(host.querySelectorAll('svg *').length).toBe(frame.items.length);
  });

  it('cancels what is playing when it goes away', async () => {
    const { scene, text } = SCENES[0];
    const fixture = await render(buildFrame(scene, 'contrast', text), 'auto', buildTimeline(scene, 'future', 'contrast', 'full'));
    fixture.destroy();
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c.cancel).toHaveBeenCalled();
  });

  it('shows the final state where the Web Animations API is missing', async () => {
    delete (Element.prototype as Partial<Element>).animate;
    const { scene, text } = SCENES[0];
    const frame = buildFrame(scene, 'plan', text);
    const host = (await render(frame, 'auto', buildTimeline(scene, 'contrast', 'plan', 'full'))).nativeElement as HTMLElement;
    expect(host.querySelectorAll('[data-vis-id]').length).toBe(frame.items.length);
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

describe('SVG backend: glides between values (M5)', () => {
  /** A test clock: frames run only when a test says so. */
  let waiting: ((time: number) => void)[] = [];
  let clock = 1000;
  const fake: FrameClock = {
    now: () => clock,
    request: (f) => waiting.push(f),
    cancel: () => (waiting = []),
  };
  /** Runs the waiting frame `ms` after the change began. */
  const at = (ms: number) => {
    const next = waiting;
    waiting = [];
    for (const f of next) f(1000 + ms);
  };
  beforeEach(() => {
    waiting = [];
    clock = 1000;
  });

  async function change(before: Composed, after: Composed) {
    TestBed.configureTestingModule({ imports: [SvgBackend], providers: [{ provide: FRAME_CLOCK, useValue: fake }] });
    const fixture = TestBed.createComponent(SvgBackend);
    fixture.componentRef.setInput('frame', buildComposedFrame(before));
    await fixture.whenStable();
    fixture.componentRef.setInput('frame', buildComposedFrame(after));
    fixture.componentRef.setInput('timeline', buildChangeTimeline(before.scene, after.scene, 'shown', lookupOf(after), 'full'));
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }
  const drawing = (composed: Composed, id: string) => {
    const item = buildComposedFrame(composed).items.find((i) => i.id === id);
    return item?.kind === 'shape' ? pathData(item.shape) : null;
  };

  it('draws a shape from where it was, through the drawings between, to the frame’s own, then stops', async () => {
    const [a, b] = [barsFigure(BAR_SETS[0]), barsFigure(BAR_SETS[1])];
    const { host } = await change(a, b);
    const bar = () => host.querySelector('[data-vis-id="bar-1"]')!.getAttribute('d');
    expect(bar()).toBe(drawing(a, 'bar-1'));
    expect(waiting).toHaveLength(1);
    at(150);
    expect([drawing(a, 'bar-1'), drawing(b, 'bar-1')]).not.toContain(bar());
    at(300);
    expect(bar()).toBe(drawing(b, 'bar-1'));
    // Done: no frame waits.
    expect(waiting).toHaveLength(0);
  });

  it('asks for no frames when nothing glides', async () => {
    await change(barsFigure(BAR_SETS[0]), barsFigure(BAR_SETS[0]));
    expect(waiting).toHaveLength(0);
  });

  it('starts a new glide from where the shape is drawn now', async () => {
    const [a, b, c] = [0, 1, 2].map((i) => barsFigure(BAR_SETS[i]));
    const { fixture, host } = await change(a, b);
    at(150);
    const halfway = host.querySelector('[data-vis-id="bar-1"]')!.getAttribute('d');
    clock = 1150;
    fixture.componentRef.setInput('frame', buildComposedFrame(c));
    fixture.componentRef.setInput('timeline', buildChangeTimeline(b.scene, c.scene, 'shown', lookupOf(c), 'full'));
    await fixture.whenStable();
    expect(host.querySelector('[data-vis-id="bar-1"]')!.getAttribute('d')).toBe(halfway);
  });

  it('shows the final drawing at once when a new timeline is empty', async () => {
    const [a, b] = [barsFigure(BAR_SETS[0]), barsFigure(BAR_SETS[1])];
    const { fixture, host } = await change(a, b);
    at(100);
    fixture.componentRef.setInput('timeline', []);
    await fixture.whenStable();
    expect(host.querySelector('[data-vis-id="bar-1"]')!.getAttribute('d')).toBe(drawing(b, 'bar-1'));
    expect(waiting).toHaveLength(0);
  });

  it('crossfades a shape that can’t morph: a copy of its old drawing fades out over it', async () => {
    const calls: { target: Element; keyframes: Keyframe[] }[] = [];
    Element.prototype.animate = function (this: Element, keyframes: Keyframe[]) {
      calls.push({ target: this, keyframes });
      return { cancel: () => undefined } as unknown as Animation;
    } as Element['animate'];
    try {
      const { host } = await change(setFigure(4), setFigure(5));
      const ghost = host.querySelector('[data-vis-ghost="outline"]');
      expect(ghost?.getAttribute('d')).toBe(drawing(setFigure(4), 'outline'));
      expect(calls.find((c) => c.target === ghost)?.keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
      expect(calls.find((c) => c.target.getAttribute('data-vis-id') === 'outline')?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    } finally {
      delete (Element.prototype as Partial<Element>).animate;
    }
  });

  it('draws a departing item as it was, where it was, and lets it leave', async () => {
    const calls: { target: Element; keyframes: Keyframe[] }[] = [];
    Element.prototype.animate = function (this: Element, keyframes: Keyframe[]) {
      calls.push({ target: this, keyframes });
      return { cancel: () => undefined } as unknown as Animation;
    } as Element['animate'];
    try {
      const { fixture, host } = await change(routeFigure(4), routeFigure(3));
      const leg = host.querySelector('[data-vis-leaving="leg-3"]')!;
      const stop = host.querySelector('[data-vis-leaving="stop-3"]')!;
      // Under the first stop, as it was drawn; the stop that goes on top.
      expect(leg.nextElementSibling?.getAttribute('data-vis-id')).toBe('stop-0');
      expect(leg.getAttribute('d')).toBe('M206 130 L274 80');
      expect(stop.parentElement?.lastElementChild).toBe(stop);
      // The leg is taken back through a mask; the stop fades.
      const mask = host.querySelector(`mask[id$="leaving-leg-3"]`)!;
      expect(leg.getAttribute('mask')).toBe(`url(#${mask.id})`);
      expect(calls.find((c) => c.target.parentElement === mask)?.keyframes).toEqual([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }]);
      expect(calls.find((c) => c.target === stop)?.keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
      // A new change ends it: nothing is left behind.
      fixture.componentRef.setInput('timeline', []);
      await fixture.whenStable();
      expect(host.querySelectorAll('[data-vis-leaving], mask[id*="leaving"]')).toHaveLength(0);
    } finally {
      delete (Element.prototype as Partial<Element>).animate;
    }
  });
});
