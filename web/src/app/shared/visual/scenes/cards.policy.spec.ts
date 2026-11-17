import { AREA_FIGURES } from '../../../../content';
import { EXERCISES } from '../../../experiences/registry';
import { elementsOf } from '../composition/scene';
import { contentText } from '../integration/content-text';
import { ACTION_CARDS, CARD_WISH } from './action/cards.scene';
import { MCII_PATH } from './action/mcii-path.scene';
import { CARD_STATE } from './cards';
import { COGNITIVE_CARDS } from './cognitive/cards.scene';

/**
 * Scene policy for the card figures (scenes/cards.ts, docs/visual-policy.md §8), as assertions.
 * A change that breaks one of these needs the card pattern changed first.
 */
const CARDS = [...COGNITIVE_CARDS, ...ACTION_CARDS];
const text = contentText({ figures: AREA_FIGURES });
const exerciseOf = (alt: string) => alt.split('.')[2];

describe('card figures scene policy', () => {
  it('gives every exercise on an area page its own card figure, once', () => {
    const shown = CARDS.map((s) => exerciseOf(s.alt[CARD_STATE]));
    expect(new Set(shown).size).toBe(shown.length);
    expect([...shown].sort()).toEqual(EXERCISES.map((e) => e.value).sort());
  });

  it("draws each in its exercise's area theme: cognitive shifts in the soft blue, action and growth in the action blue", () => {
    for (const scene of CARDS) {
      const exercise = EXERCISES.find((e) => e.value === exerciseOf(scene.alt[CARD_STATE]))!;
      expect(scene.theme, scene.id).toBe(exercise.area === 'cognitive-shifts' ? 'cognitive' : 'action');
    }
  });

  it('is one still banner: one state, no words, nothing that moves', () => {
    for (const scene of CARDS) {
      expect(scene.frame, scene.id).toBe('banner');
      expect(Object.keys(scene.states.states), scene.id).toEqual([CARD_STATE]);
      expect(scene.transitions, scene.id).toBeUndefined();
      for (const { element } of elementsOf(scene)) {
        expect(element.kind, `${scene.id}/${element.id}`).not.toBe('label');
        expect(element.enter, `${scene.id}/${element.id}`).toBeUndefined();
        expect(element.exit, `${scene.id}/${element.id}`).toBeUndefined();
      }
    }
  });

  it('has a text alternative in content for every card', () => {
    for (const scene of CARDS) expect(text(scene.alt[CARD_STATE]), scene.id).toBeTruthy();
  });

  it("lies on the area's ground, drawn first, with its edge outside the frame", () => {
    for (const scene of CARDS) {
      const [first] = elementsOf(scene);
      expect(first.element.id, scene.id).toBe('ground');
      expect(first.layer.plane, scene.id).toBe('backdrop');
      expect(first.element).toMatchObject({ style: { role: 'far', material: 'tonal' }, geometry: { x: -2, y: -2, width: 484, height: 124 } });
    }
  });

  it('keeps to the element budget: about seven forms, and a reason for every one past seven', () => {
    for (const scene of CARDS) {
      const forms = elementsOf(scene).length;
      expect(forms, scene.id).toBeLessThanOrEqual(8);
      if (forms > 7) expect(scene.changes?.some((c) => /element budget/.test(c)), scene.id).toBe(true);
    }
  });

  it('uses the area colour only for what the exercise does, and neutral for what the person brings', () => {
    const roles = (id: string) => Object.fromEntries(elementsOf(CARDS.find((s) => s.id === id)!).map(({ element: e }) => [e.id, 'style' in e ? e.style.role : null]));
    expect(roles('card.other-readings')).toMatchObject({ situation: 'context', lenses: 'subject', fit: 'subject' });
    expect(roles('card.why-it-happened')).toMatchObject({ setback: 'context', map: 'subject', chosen: 'subject' });
    expect(roles('card.not-enough')).toMatchObject({ facts: 'context', missing: 'subject', 'find-out': 'subject', readings: 'subject' });
    expect(roles('card.camera-angle')).toMatchObject({ moment: 'context', 'close-camera': 'subject', 'far-camera': 'subject' });
  });

  it('draws the lenses of "Other ways to read it" as three circles of one size, not ellipses (review, 2026-11-16)', () => {
    const lenses = elementsOf(CARDS.find((s) => s.id === 'card.other-readings')!).find((e) => e.element.id === 'lenses')!.element;
    if (lenses.kind !== 'shape' || lenses.geometry.type !== 'path') throw new Error('unexpected geometry');
    const arcs = [...lenses.geometry.d.matchAll(/a(\d+) (\d+) /g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(arcs).toHaveLength(6);
    for (const [rx, ry] of arcs) expect([rx, ry]).toEqual([13, 13]);
  });

  it('shows the readings of "Not enough to go on" with equal weight, and what is missing dotted', () => {
    const scene = CARDS.find((s) => s.id === 'card.not-enough')!;
    const find = (id: string) => elementsOf(scene).find((e) => e.element.id === id)!.element;
    expect(find('missing')).toMatchObject({ style: { dash: 'tentative' } });
    expect(find('fork')).toMatchObject({ style: { dash: 'tentative' } });
    expect(find('readings')).not.toHaveProperty('style.dash');
  });

  it('shows the wish card as the MCII figure itself, in its contrast state, with the wish in its colour', () => {
    const forms = elementsOf(CARD_WISH).filter(({ element }) => element.id !== 'ground');
    const contrast = MCII_PATH.states.states['contrast'].visible;
    for (const { element } of forms) {
      const original = elementsOf(MCII_PATH).find((o) => o.element.id === element.id)!.element;
      expect(contrast, element.id).toContain(element.id);
      const { line: _line, ...style } = (original as unknown as { style: Record<string, unknown> }).style;
      // The same forms and colours; only the courses' weight differs (see the scene's changes).
      expect(element).toMatchObject({ geometry: (original as { geometry: unknown }).geometry, style });
    }
    expect(forms.find((f) => f.element.id === 'wish')!.element).toMatchObject({ style: { role: 'subject' } });
  });
});
