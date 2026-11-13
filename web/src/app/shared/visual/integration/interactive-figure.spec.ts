import { Component, computed, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CHOICES, choiceFigure, fieldFigure, ratingFigure } from '../../../pages/lab/lab-interaction-figures';
import { ControlledBy, InteractiveFigure, Values } from './interactive-figure';

type Kind = 'rating' | 'field' | 'choice';
const SIZES: Record<Kind, { width: number; height: number }> = { rating: { width: 480, height: 100 }, field: { width: 480, height: 300 }, choice: { width: 480, height: 120 } };

/** An exercise in miniature: it holds the value and draws the figure again from it. */
@Component({
  imports: [InteractiveFigure],
  template: `<app-vis-interactive [composed]="composed()" [values]="values()" (valuesChange)="changed($event)" [controlledBy]="controlledBy()" />`,
})
class Host {
  readonly figure = input<Kind>('rating');
  readonly controlledBy = input<ControlledBy>('figure');
  readonly values = signal<Values>({ rating: 3 });
  readonly reports: Values[] = [];
  readonly composed = computed(() => {
    const v = this.values();
    if (this.figure() === 'choice') return choiceFigure(v['choice'] as (typeof CHOICES)[number]);
    return this.figure() === 'rating' ? ratingFigure(Number(v['rating'])) : fieldFigure(Number(v['across']), Number(v['up']));
  });
  changed(v: Values): void {
    this.reports.push(v);
    this.values.set(v);
  }
}

async function mount(figure: Kind = 'rating', controlledBy: ControlledBy = 'figure') {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput('figure', figure);
  fixture.componentRef.setInput('controlledBy', controlledBy);
  if (figure === 'field') fixture.componentInstance.values.set({ across: 2, up: 4 });
  if (figure === 'choice') fixture.componentInstance.values.set({ choice: 'second' });
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const figureEl = root.querySelector('app-vis-interactive') as HTMLElement;
  // Drawn at its design size from the page's top left, so client points are scene units.
  const svg = figureEl.querySelector('svg')!;
  const { width, height } = SIZES[figure];
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, x: 0, y: 0, right: width, bottom: height, toJSON: () => ({}) });
  return { fixture, host: fixture.componentInstance, figure: figureEl };
}

function pointer(target: Element, type: string, x: number, y: number) {
  const event = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true });
  Object.defineProperties(event, { isPrimary: { value: true }, pointerId: { value: 1 } });
  target.dispatchEvent(event);
}

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const markWidth = (figure: HTMLElement) => (figure.querySelector('[data-vis-id="mark"]') as SVGElement).style.strokeWidth;

describe('InteractiveFigure (M4 stage B)', () => {
  it('is a group of sliders when it is the control: one stop per axis, with the exercise’s values', async () => {
    const { figure } = await mount('field');
    expect(figure.getAttribute('role')).toBe('group');
    expect(figure.getAttribute('aria-label')).toContain('a mark at 2 across and 4 up');
    const stops = [...figure.querySelectorAll('[role="slider"]')];
    expect(stops.map((s) => [s.getAttribute('aria-label'), s.getAttribute('aria-valuenow'), s.getAttribute('aria-orientation')])).toEqual([
      ['Place, across', '2', 'horizontal'],
      ['Place, up', '4', 'vertical'],
    ]);
    expect(stops.every((s) => s.getAttribute('tabindex') === '0' && s.getAttribute('aria-valuemin') === '1' && s.getAttribute('aria-valuemax') === '5')).toBe(true);
  });

  it('is a picture with no stops when a native control holds the value', async () => {
    const { figure } = await mount('rating', 'native');
    expect(figure.getAttribute('role')).toBe('img');
    expect(figure.querySelectorAll('[role="slider"]').length).toBe(0);
  });

  it('steps with the keyboard, reports the value, and shows the focus ring', async () => {
    const { fixture, host, figure } = await mount();
    const stop = figure.querySelector('[role="slider"]')!;
    key(stop, 'ArrowRight');
    await fixture.whenStable();
    expect(host.reports).toEqual([{ rating: 4 }]);
    expect(stop.getAttribute('aria-valuenow')).toBe('4');
    expect(figure.querySelector('[data-vis-id="mark-focus"]')).not.toBeNull();
    key(stop, 'End');
    key(stop, 'End');
    await fixture.whenStable();
    // Already at the end: nothing more to report.
    expect(host.reports).toEqual([{ rating: 4 }, { rating: 5 }]);
  });

  it('drags: the handle is focal while it moves, snaps, and Escape puts it back', async () => {
    const { fixture, host, figure } = await mount();
    expect(markWidth(figure)).toBe('2.5px');
    pointer(figure, 'pointerdown', 240, 44);
    await fixture.whenStable();
    expect(markWidth(figure)).toBe('3px');
    pointer(figure, 'pointermove', 420, 44);
    await fixture.whenStable();
    expect(host.values()).toEqual({ rating: 5 });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(host.values()).toEqual({ rating: 3 });
    expect(markWidth(figure)).toBe('2.5px');
    pointer(figure, 'pointermove', 60, 44);
    pointer(figure, 'pointerup', 60, 44);
    await fixture.whenStable();
    expect(host.reports).toEqual([{ rating: 5 }, { rating: 3 }]);
  });

  it('places by clicks alone: pick the handle up, then click where it goes', async () => {
    const { fixture, host, figure } = await mount();
    pointer(figure, 'pointerdown', 240, 44);
    pointer(figure, 'pointerup', 240, 44);
    await fixture.whenStable();
    expect(host.reports).toEqual([]);
    expect(markWidth(figure)).toBe('3px');
    pointer(figure, 'pointerdown', 150, 80);
    pointer(figure, 'pointerup', 150, 80);
    await fixture.whenStable();
    expect(host.values()).toEqual({ rating: 2 });
    expect(markWidth(figure)).toBe('2.5px');
  });

  it('places the handle where its track is pressed', async () => {
    const { fixture, host, figure } = await mount();
    pointer(figure, 'pointerdown', 400, 50);
    pointer(figure, 'pointerup', 400, 50);
    await fixture.whenStable();
    expect(host.values()).toEqual({ rating: 5 });
  });

  it('puts a picked-up handle down where it was when the page is clicked elsewhere', async () => {
    const { fixture, host, figure } = await mount();
    pointer(figure, 'pointerdown', 240, 44);
    pointer(figure, 'pointerup', 240, 44);
    pointer(document.body, 'pointerdown', 5, 500);
    await fixture.whenStable();
    expect(markWidth(figure)).toBe('2.5px');
    pointer(figure, 'pointerdown', 60, 44);
    await fixture.whenStable();
    // That press was on the track, a new gesture: not the put-down of the earlier pick-up.
    expect(host.values()).toEqual({ rating: 1 });
  });

  it('is a radio group for a choice: one stop, the arrows move and choose, a press chooses', async () => {
    const { fixture, host, figure } = await mount('choice');
    const group = figure.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute('aria-label')).toBe('Option');
    const radios = () => [...figure.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(radios().map((r) => [r.getAttribute('aria-label'), r.getAttribute('aria-checked'), r.getAttribute('tabindex')])).toEqual([
      ['First', 'false', '-1'],
      ['Second', 'true', '0'],
      ['Third', 'false', '-1'],
    ]);
    key(radios()[1], 'ArrowRight');
    await fixture.whenStable();
    expect(host.values()).toEqual({ choice: 'third' });
    expect(document.activeElement).toBe(radios()[2]);
    expect(radios()[2].getAttribute('tabindex')).toBe('0');
    expect(figure.querySelector('[data-vis-id="third-focus"]')).not.toBeNull();
    key(radios()[2], 'ArrowRight');
    await fixture.whenStable();
    expect(host.values()).toEqual({ choice: 'first' });
    pointer(figure, 'pointerdown', 240, 60);
    pointer(figure, 'pointerup', 240, 60);
    await fixture.whenStable();
    expect(host.reports).toEqual([{ choice: 'third' }, { choice: 'first' }, { choice: 'second' }]);
  });
});
