import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { QualityTier } from '../motion/plan-motion';
import { FRAME_CLOCK, FrameClock } from '../rendering/frame-clock';
import { viewpointMoveMs } from '../styling/vocabulary';
import { ViewpointFigure } from './viewpoint-figure';

/** A frame clock moved by hand. */
class Clock implements FrameClock {
  time = 0;
  private waiting = new Map<number, (t: number) => void>();
  private next = 1;
  now(): number {
    return this.time;
  }
  request(callback: (t: number) => void): number {
    const h = this.next++;
    this.waiting.set(h, callback);
    return h;
  }
  cancel(handle: number): void {
    this.waiting.delete(handle);
  }
  get pending(): number {
    return this.waiting.size;
  }
  advance(ms: number): void {
    this.time += ms;
    const due = [...this.waiting.values()];
    this.waiting.clear();
    for (const cb of due) cb(this.time);
  }
}

const WORDS = { you: 'You', alts: ['Through your own eyes.', 'One step back.', 'From across the room.', 'From further away.'] };

/** An exercise in miniature: it holds the position, and follows the figure's reports. */
@Component({
  imports: [ViewpointFigure],
  template: `<app-vis-viewpoint instrument="room" [inputs]="inputs" [position]="position()" [tier]="tier()" (positionChange)="report($event)" />`,
})
class Host {
  readonly inputs = { words: WORDS };
  readonly position = signal(0);
  readonly tier = signal<QualityTier | 'auto'>('full');
  readonly reports: number[] = [];
  report(p: number): void {
    this.reports.push(p);
    this.position.set(p);
  }
}

async function mount(tier: QualityTier | 'auto' = 'full') {
  const clock = new Clock();
  TestBed.configureTestingModule({ imports: [Host], providers: [{ provide: FRAME_CLOCK, useValue: clock }] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.tier.set(tier);
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('app-vis-viewpoint') as HTMLElement;
  const figure = fixture.debugElement.children[0].componentInstance as ViewpointFigure;
  return { fixture, host: fixture.componentInstance, el, figure, clock };
}

function pointer(target: Element, type: string, x: number) {
  const event = new MouseEvent(type, { clientX: x, clientY: 100, button: 0, bubbles: true, cancelable: true });
  Object.defineProperties(event, { isPrimary: { value: true }, pointerId: { value: 1 } });
  target.dispatchEvent(event);
}

describe('ViewpointFigure (a spatial view)', () => {
  it('is a picture named by the exercise’s text alternative for its position, drawn on a canvas', async () => {
    const { el, figure } = await mount();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Through your own eyes.');
    expect(el.querySelector('canvas')).not.toBeNull();
    expect(figure.view()).toBe(0);
  });

  it('moves to a new position as one movement on the frame clock, and ends exactly there, then idles', async () => {
    const { fixture, host, el, figure, clock } = await mount();
    host.position.set(3);
    await fixture.whenStable();
    const total = viewpointMoveMs(3);
    expect(total).toBeLessThanOrEqual(1600);
    clock.advance(total / 2);
    expect(figure.view()).toBeGreaterThan(0);
    expect(figure.view()).toBeLessThan(3);
    // It passes the positions between without stopping at them.
    const mid = figure.view();
    clock.advance(16);
    expect(figure.view()).toBeGreaterThan(mid);
    clock.advance(total);
    expect(figure.view()).toBe(3);
    expect(clock.pending).toBe(0);
    await fixture.whenStable();
    expect(el.getAttribute('aria-label')).toBe('From further away.');
  });

  it('carries on from where the view is when a new position comes mid-move', async () => {
    const { fixture, host, figure, clock } = await mount();
    host.position.set(2);
    await fixture.whenStable();
    clock.advance(200);
    const where = figure.view();
    host.position.set(0);
    await fixture.whenStable();
    clock.advance(16);
    expect(Math.abs(figure.view() - where)).toBeLessThan(0.2);
    clock.advance(2000);
    expect(figure.view()).toBe(0);
  });

  it('cuts straight to the new position under reduced motion, with nothing left running', async () => {
    const { fixture, host, figure, clock } = await mount('reduced');
    host.position.set(2);
    await fixture.whenStable();
    expect(figure.view()).toBe(2);
    expect(clock.pending).toBe(0);
  });

  it('follows a drag across it and settles on the nearest position, which it reports', async () => {
    const { fixture, host, el, figure, clock } = await mount();
    pointer(el, 'pointerdown', 100);
    pointer(el, 'pointermove', 100 + (960 / 3.8) * 1.2);
    expect(figure.view()).toBeCloseTo(1.2, 1);
    pointer(el, 'pointermove', 100 + (960 / 3.8) * 1.7);
    pointer(el, 'pointerup', 100 + (960 / 3.8) * 1.7);
    expect(host.reports).toEqual([2]);
    await fixture.whenStable();
    clock.advance(1000);
    expect(figure.view()).toBe(2);
    // A drag back past the start holds at the first position.
    pointer(el, 'pointerdown', 500);
    pointer(el, 'pointermove', -2000);
    expect(figure.view()).toBe(0);
    pointer(el, 'pointerup', -2000);
    expect(host.reports).toEqual([2, 0]);
  });
});
