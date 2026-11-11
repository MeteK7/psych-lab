import { TestBed } from '@angular/core/testing';

import { MCII } from '../../../content';
import { provideSceneVisuals } from '../../shared/visual/integration/scene-source';
import { VISUAL_SOURCE } from '../../shared/visual/visual';
import {
  canLeaveClose,
  canLeaveDecide,
  canLeavePlan,
  canLeaveWish,
  closeOutcome,
  decideOutcome,
  isMciiStage,
  obstacleFrom,
  planOutcome,
  planSentence,
  wishAfterDecide,
  wishOutcome,
} from './mcii-logic';
import { sceneFor } from './mcii-scenes';

// The rules and scenes, with no screens. The screens are run in mcii-exercise.spec.ts.
const PRIVATE = 'PRIVATE';

describe('MCII rules', () => {
  it('knows its own steps', () => {
    expect(isMciiStage('mcii_plan')).toBe(true);
    expect(isMciiStage('cs3_first')).toBe(false);
    expect(isMciiStage(undefined)).toBe(false);
  });

  describe('the wish', () => {
    const answers = { wish: PRIVATE, category: 'work', matter: 7, likely: 2 };

    it('needs the wish, its category and both ratings', () => {
      expect(canLeaveWish(answers)).toBe(true);
      expect(canLeaveWish({ ...answers, wish: '  ' })).toBe(false);
      expect(canLeaveWish({ ...answers, category: null })).toBe(false);
      expect(canLeaveWish({ ...answers, matter: null })).toBe(false);
      expect(canLeaveWish({ ...answers, likely: null })).toBe(false);
    });

    it('reports ids, ratings and the visual source, never the wish', () => {
      expect(wishOutcome(answers, 'scene:mcii.path@4;theme:action@1')).toEqual({
        result: { category: 'work', visual_source: 'scene:mcii.path@4;theme:action@1' },
        ratings: { mcii_matter_pre: 7, mcii_likely_pre: 2 },
      });
    });
  });

  describe('the obstacle', () => {
    const { cards } = MCII.obstacle;

    it("uses a card's own wording, including its wording after \"If\"", () => {
      expect(obstacleFrom('tired', cards, '', '')).toEqual({
        id: 'tired',
        text: "I put it off when I'm tired.",
        ifText: "I'm tired and want to put it off",
      });
    });

    it('uses what the person wrote for "My own" and "mostly outside me"', () => {
      expect(obstacleFrom('own', cards, ' Mine ', 'Other')).toEqual({ id: 'own', text: 'Mine', ifText: 'Mine' });
      expect(obstacleFrom('outside', cards, 'Mine', ' Other ')).toEqual({ id: 'outside', text: 'Other', ifText: 'Other' });
    });

    it('has none until something is chosen and written', () => {
      expect(obstacleFrom(null, cards, 'Mine', 'Other')).toBeNull();
      expect(obstacleFrom('own', cards, ' ', 'Other')).toBeNull();
      expect(obstacleFrom('outside', cards, 'Mine', '')).toBeNull();
    });

    it('never names a trait on a card', () => {
      for (const card of cards) expect(card.text).not.toMatch(/\b(lazy|weak|useless|stupid|failure|hopeless|bad at)\b/i);
    });

    it('gives every card a wording that follows "If"', () => {
      for (const card of cards) expect(card.if_text).toMatch(/^[a-zI]/);
    });
  });

  describe('look at both', () => {
    const answers = { likely: 5, choice: 'keep' as const, newWish: '' };

    it('needs a rating and a choice', () => {
      expect(canLeaveDecide({ ...answers, likely: null })).toBe(false);
      expect(canLeaveDecide({ ...answers, choice: null })).toBe(false);
      expect(canLeaveDecide(answers)).toBe(true);
    });

    it('accepts every rating with every choice: a low rating never decides anything', () => {
      for (const likely of [0, 5, 10]) {
        for (const choice of ['keep', 'set_aside'] as const) {
          expect(canLeaveDecide({ likely, choice, newWish: '' })).toBe(true);
        }
      }
    });

    it('needs the new wish for "Change it"', () => {
      expect(canLeaveDecide({ ...answers, choice: 'change', newWish: '  ' })).toBe(false);
      expect(canLeaveDecide({ ...answers, choice: 'change', newWish: 'A smaller wish' })).toBe(true);
    });

    it('reports the choice and the rating, never the new wish', () => {
      const outcome = decideOutcome({ likely: 4, choice: 'change', newWish: PRIVATE });
      expect(outcome).toEqual({ result: { choice: 'change' }, ratings: { mcii_likely_post: 4 } });
    });

    it('carries the rewritten wish forward only under "Change it"', () => {
      expect(wishAfterDecide('Old', { likely: 4, choice: 'change', newWish: ' New ' })).toBe('New');
      expect(wishAfterDecide('Old', { likely: 4, choice: 'keep', newWish: 'New' })).toBe('Old');
    });
  });

  describe('the plan', () => {
    it('reads as one sentence', () => {
      expect(planSentence("I'm tired and want to put it off", 'start with just five minutes.')).toBe(
        "If I'm tired and want to put it off, then I will start with just five minutes.",
      );
    });

    it('copes with people writing the sentence\'s own words', () => {
      expect(planSentence('If I am tired.', 'Then I will go for a walk!')).toBe('If I am tired, then I will go for a walk.');
      expect(planSentence('I get an idea', 'I will write it down')).toBe('If I get an idea, then I will write it down.');
    });

    it('keeps words that only start like the sentence\'s own', () => {
      expect(planSentence('iffy weather comes', 'thenceforth walk')).toBe('If iffy weather comes, then I will thenceforth walk.');
    });

    it('needs both parts', () => {
      expect(canLeavePlan('I am tired', 'rest')).toBe(true);
      expect(canLeavePlan('  ', 'rest')).toBe(false);
      expect(canLeavePlan('I am tired', undefined)).toBe(false);
      expect(canLeavePlan('If', 'Then I will')).toBe(false);
    });

    it('reports the response type, never the plan', () => {
      expect(planOutcome('five_minutes')).toEqual({ result: { then: 'five_minutes' } });
      expect(planOutcome(null)).toEqual({ result: { then: null } });
    });
  });

  describe('keeping it', () => {
    it('needs a feeling, and readiness only when there is a plan', () => {
      expect(canLeaveClose(true, 5, 'same')).toBe(true);
      expect(canLeaveClose(true, null, 'same')).toBe(false);
      expect(canLeaveClose(true, 5, null)).toBe(false);
      expect(canLeaveClose(false, null, 'same')).toBe(true);
      expect(canLeaveClose(false, null, null)).toBe(false);
    });

    it('asks no readiness question of a wish set aside', () => {
      expect(closeOutcome(true, 8, 'encouraged')).toEqual({ result: { feeling: 'encouraged' }, ratings: { mcii_ready_post: 8 } });
      expect(closeOutcome(false, null, 'discouraged')).toEqual({ result: { feeling: 'discouraged' } });
    });
  });
});

describe('MCII scenes', () => {
  it('shows the future first, then the wall', () => {
    expect(sceneFor('mcii_wish', null).scene).toBe('mcii.future');
    expect(sceneFor('mcii_outcome', null).scene).toBe('mcii.future');
    expect(sceneFor('mcii_obstacle', null).scene).toBe('mcii.contrast');
  });

  it('keeps the same picture at "Look at both", whatever is chosen', () => {
    for (const choice of [null, 'keep', 'change', 'set_aside'] as const) {
      expect(sceneFor('mcii_decide', choice).scene).toBe('mcii.contrast');
    }
  });

  it('names the scene the step before showed, only when it was a different one', () => {
    expect(sceneFor('mcii_wish', null)).toEqual({ scene: 'mcii.future' });
    expect(sceneFor('mcii_outcome', null)).toEqual({ scene: 'mcii.future' });
    expect(sceneFor('mcii_obstacle', null)).toEqual({ scene: 'mcii.contrast', facets: { from: 'mcii.future' } });
    expect(sceneFor('mcii_decide', 'keep')).toEqual({ scene: 'mcii.contrast' });
    expect(sceneFor('mcii_plan', 'keep')).toEqual({ scene: 'mcii.plan', facets: { from: 'mcii.contrast' } });
    expect(sceneFor('mcii_plan', 'set_aside')).toEqual({ scene: 'mcii.aside', facets: { from: 'mcii.contrast' } });
    expect(sceneFor('mcii_close', 'set_aside')).toEqual({ scene: 'mcii.aside' });
  });

  it('shows the bridge after a plan, and a quieter path after setting aside', () => {
    expect(sceneFor('mcii_plan', 'keep').scene).toBe('mcii.plan');
    expect(sceneFor('mcii_plan', 'change').scene).toBe('mcii.plan');
    expect(sceneFor('mcii_plan', 'set_aside').scene).toBe('mcii.aside');
    expect(sceneFor('mcii_close', 'keep').scene).toBe('mcii.plan');
    expect(sceneFor('mcii_close', 'set_aside').scene).toBe('mcii.aside');
  });

  it('draws every scene with the path scene, with its text alternative', async () => {
    TestBed.configureTestingModule({ providers: [provideSceneVisuals('mcii.path', 'mcii')] });
    const source = TestBed.inject(VISUAL_SOURCE);
    expect(source.id).toBe('scene:mcii.path'); // nothing drawn yet
    for (const name of ['future', 'contrast', 'plan', 'aside'] as const) {
      const visual = await source.resolve({ scene: `mcii.${name}` });
      expect(visual).toMatchObject({ kind: 'component', alt: MCII.scenes[name].alt, inputs: { state: name, from: null } });
    }
    expect(await source.resolve({ scene: 'mcii.contrast', facets: { from: 'mcii.future' } })).toMatchObject({ inputs: { from: 'future' } });
    expect(source.id).toMatch(/^scene:mcii\.path@\d+;theme:action@\d+$/);
    expect(await source.resolve({ scene: 'unknown' })).toEqual({ kind: 'none' });
    expect(await source.resolve({ scene: 'mcii.unknown' })).toEqual({ kind: 'none' });
  });
});
