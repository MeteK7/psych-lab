import { SHOWN, composeScene } from '../composition/compose';
import { ScaleDef, SceneDefinition } from '../composition/scene';
import { InteractionState, escape, keyChoice, keyStep, lost, move, moving, press, putDown, release } from './controller';
import { targetsOf } from './regions';

const rating: ScaleDef = { kind: 'linear', domain: [1, 5], range: [60, 420], step: 1 };
const across: ScaleDef = { kind: 'linear', domain: [1, 5], range: [150, 410], step: 1 };
const up: ScaleDef = { kind: 'linear', domain: [1, 5], range: [250, 30], step: 1 };
const level: ScaleDef = { kind: 'points', values: ['low', 'mid', 'high'], range: [60, 420] };
const P = { serves: ['interaction'], why: 'Test target.' } as const;

/** A mark on the rating scale, drawn at its value, with its track. */
function ratingScene(value: number): SceneDefinition {
  const x = 60 + ((value - 1) / 4) * 360;
  return composeScene({
    id: 'test.controller',
    version: 1,
    theme: 'action',
    size: { width: 480, height: 100 },
    scales: { rating },
    layers: [
      {
        id: 'l',
        plane: 'subject',
        elements: [
          { kind: 'shape', id: 'track', geometry: { type: 'line', x1: 60, y1: 44, x2: 420, y2: 44 }, style: { role: 'context' }, purpose: P },
          {
            kind: 'shape',
            id: 'mark',
            geometry: { type: 'circle', cx: x, cy: 44, r: 11 },
            style: { role: 'subject', material: 'tonal' },
            purpose: P,
            target: { kind: 'handle', x: { scale: 'rating', value: 'rating' }, track: 'track', label: 'mark' },
          },
        ],
      },
    ],
    alt: 'A test.',
  }).scene;
}

const start = (rating: number): InteractionState => ({ values: { rating }, gesture: null });

describe('S6 controller: dragging (M4 stage B)', () => {
  const scene = ratingScene(3);
  const targets = targetsOf(scene, SHOWN);

  it('drags a handle from where it was grabbed, snapped to the steps, and ends on release', () => {
    const pressed = press(scene, targets, start(3), [245, 44]);
    expect(pressed.capture).toBe(true);
    expect(moving(pressed.state)).toBe('mark');
    expect(pressed.state.values).toEqual({ rating: 3 });
    // Grabbed 5 units right of the centre: the mark follows the pointer minus that offset.
    // At 289 the mark's centre is at 284, just short of halfway between 3 (240) and 4 (330).
    let s = move(scene, pressed.state, [289, 50]);
    expect(s.values).toEqual({ rating: 3 });
    s = move(scene, s, [340, 50]);
    expect(s.values).toEqual({ rating: 4 });
    s = move(scene, s, [9999, 50]);
    expect(s.values).toEqual({ rating: 5 });
    const done = release(s);
    expect(done.gesture).toBeNull();
    expect(done.values).toEqual({ rating: 5 });
  });

  it('puts the value back on Escape, and ignores the pointer until it is released', () => {
    let s = press(scene, targets, start(3), [240, 44]).state;
    s = move(scene, s, [420, 44]);
    expect(s.values).toEqual({ rating: 5 });
    const { state, handled } = escape(s, true);
    expect(handled).toBe(true);
    expect(state.values).toEqual({ rating: 3 });
    expect(moving(state)).toBeNull();
    expect(move(scene, state, [60, 44]).values).toEqual({ rating: 3 });
    expect(release(state)).toEqual({ values: { rating: 3 }, gesture: null });
    expect(escape(start(3), false).handled).toBe(false);
  });

  it('places the handle where its track is pressed, and drags on from there', () => {
    const { state, capture } = press(scene, targets, start(3), [100, 50]);
    expect(capture).toBe(true);
    expect(state.values).toEqual({ rating: 1 });
    const s = move(scene, state, [330, 44]);
    expect(s.values).toEqual({ rating: 4 });
    // Escape goes back to the value before the press, not the one the press set.
    expect(escape(s, true).state.values).toEqual({ rating: 3 });
  });

  it('keeps the value when the pointer is lost, as a native slider does', () => {
    let s = press(scene, targets, start(3), [240, 44]).state;
    s = move(scene, s, [330, 44]);
    expect(lost(s)).toEqual({ values: { rating: 4 }, gesture: null });
  });

  it('does nothing when the press misses every target', () => {
    const s = start(3);
    expect(press(scene, targets, s, [240, 95])).toEqual({ state: s, capture: false });
  });
});

describe('S6 controller: pick up and put down, no dragging (WCAG 2.5.7)', () => {
  const scene = ratingScene(2);
  const targets = targetsOf(scene, SHOWN);

  it('picks a handle up with a click, and puts it down where the next click lands', () => {
    // A press that moves less than the slop is a click.
    let s = press(scene, targets, start(2), [150, 44]).state;
    s = move(scene, s, [151, 45]);
    s = release(s);
    expect(s.gesture?.kind).toBe('picked');
    expect(moving(s)).toBe('mark');
    // Anywhere in the figure, held to the scale: far below the line still sets a value.
    const put = press(scene, targets, s, [400, 90]);
    expect(put.capture).toBe(false);
    expect(put.state).toEqual({ values: { rating: 5 }, gesture: null });
  });

  it('puts it down unchanged on Escape or a click elsewhere on the page', () => {
    const picked = release(press(scene, targets, start(2), [150, 44]).state);
    expect(escape(picked, false).state).toEqual({ values: { rating: 2 }, gesture: null });
    expect(putDown(picked)).toEqual({ values: { rating: 2 }, gesture: null });
    // A lost pointer doesn't end a pick-up: it waits for its next click.
    expect(lost(picked)).toBe(picked);
  });

  it('puts it down where it was when the next click is on the handle itself', () => {
    const picked = release(press(scene, targets, start(2), [150, 44]).state);
    expect(press(scene, targets, picked, [152, 44]).state).toEqual({ values: { rating: 2 }, gesture: null });
  });
});

describe('S6 controller: keyboard, for a figure that is itself the control', () => {
  const one = { kind: 'handle', x: { scale: 'rating', value: 'rating' }, label: 'mark' } as const;
  const two = { kind: 'handle', x: { scale: 'across', value: 'across', label: 'a' }, y: { scale: 'up', value: 'up', label: 'u' }, label: 'mark' } as const;
  const points = { kind: 'handle', x: { scale: 'level', value: 'level' }, label: 'mark' } as const;
  const scene = { ...ratingScene(3), scales: { rating, across, up, level } };

  it('steps one handle on one axis with any arrow, and jumps with Home, End and the page keys', () => {
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'ArrowRight')).toEqual({ rating: 4 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'ArrowUp')).toEqual({ rating: 4 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'ArrowLeft')).toEqual({ rating: 2 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'ArrowDown')).toEqual({ rating: 2 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'Home')).toEqual({ rating: 1 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'End')).toEqual({ rating: 5 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'PageUp')).toEqual({ rating: 4 });
    expect(keyStep(scene, one, 'x', { rating: 3 }, 'Enter')).toBeNull();
  });

  it('holds at the ends, returning the same values (nothing to report)', () => {
    const values = { rating: 5 };
    expect(keyStep(scene, one, 'x', values, 'ArrowRight')).toBe(values);
  });

  it('on a handle with two axes, each stop takes the arrows of its own direction, as they look on screen', () => {
    const v = { across: 2, up: 4 };
    expect(keyStep(scene, two, 'x', v, 'ArrowRight')).toEqual({ across: 3, up: 4 });
    expect(keyStep(scene, two, 'x', v, 'ArrowUp')).toBeNull();
    // The up scale runs upwards on screen: ArrowUp raises its value.
    expect(keyStep(scene, two, 'y', v, 'ArrowUp')).toEqual({ across: 2, up: 5 });
    expect(keyStep(scene, two, 'y', v, 'ArrowDown')).toEqual({ across: 2, up: 3 });
    expect(keyStep(scene, two, 'y', v, 'ArrowLeft')).toBeNull();
    expect(keyStep(scene, two, 'y', v, 'Home')).toEqual({ across: 2, up: 1 });
  });

  it('steps through the values of a points scale', () => {
    expect(keyStep(scene, points, 'x', { level: 'low' }, 'ArrowRight')).toEqual({ level: 'mid' });
    expect(keyStep(scene, points, 'x', { level: 'mid' }, 'End')).toEqual({ level: 'high' });
  });
});

describe('S6 controller: choosing a region (M4 stage C)', () => {
  const options = ['first', 'second', 'third'];

  it('chooses with the arrows, wrapping round, and with Space', () => {
    expect(keyChoice('choice', options, 'second', { choice: 'second' }, 'ArrowRight')).toEqual({ option: 'third', values: { choice: 'third' } });
    expect(keyChoice('choice', options, 'third', { choice: 'third' }, 'ArrowDown')).toEqual({ option: 'first', values: { choice: 'first' } });
    expect(keyChoice('choice', options, 'first', { choice: 'first' }, 'ArrowUp')).toEqual({ option: 'third', values: { choice: 'third' } });
    expect(keyChoice('choice', options, 'first', {}, ' ')).toEqual({ option: 'first', values: { choice: 'first' } });
    expect(keyChoice('choice', options, 'first', {}, 'Enter')).toBeNull();
  });
});
