import { changeOrder, firstReadingClose, fitNote, offersPlan, reflections } from './cs-logic';

describe('Cognitive shifts rules', () => {
  describe('CS1 close for a first reading that still fits', () => {
    it('acknowledges self-judgements and own readings without endorsing them', () => {
      expect(firstReadingClose('self', 'fits')).toBe('first_self');
      expect(firstReadingClose('own', 'fits')).toBe('first_self');
    });

    it('says a reading of the situation may simply be right', () => {
      expect(firstReadingClose('situation', 'fits')).toBe('first_situation');
    });

    it('adds nothing when the first reading only partly fits or does not fit', () => {
      expect(firstReadingClose('self', 'partly')).toBeNull();
      expect(firstReadingClose('situation', 'not')).toBeNull();
      expect(firstReadingClose('own', null)).toBeNull();
    });
  });

  describe('CS2 map statements', () => {
    const me = { who: 1, time: 1, scope: 1 };
    const situation = { who: 5, time: 3, scope: 3 };
    const thisTime = { who: 2, time: 5, scope: 4 };

    it('always says effort is one cause among many', () => {
      expect(reflections([situation])).toContain('effort');
      expect(reflections([me])).toContain('effort');
    });

    it('notes changeable causes, and causes really about you, without judging', () => {
      expect(reflections([situation, me])).toEqual(['changeable', 'about_you', 'effort']);
    });

    it('names a heavy map only when every cause is about me, lasting and general', () => {
      expect(reflections([me, { who: 2, time: 2, scope: 2 }])).toEqual(['about_you', 'heavy', 'effort']);
      expect(reflections([me, thisTime])).not.toContain('heavy');
    });

    it('lists changeable causes first when choosing what to change', () => {
      expect(changeOrder([me, thisTime, situation])).toEqual([thisTime, situation, me]);
    });
  });

  describe('CS3 note on what the facts could fit', () => {
    it('counts the readings the facts could fit, the first one included', () => {
      expect(fitNote(1)).toEqual({ key: 'note_some', n: 2 });
      expect(fitNote(4)).toEqual({ key: 'note_some', n: 5 });
    });

    it('takes seriously a first reading that nothing else fits', () => {
      expect(fitNote(0)).toEqual({ key: 'note_none', n: 1 });
    });
  });

  describe('CS3 plan link', () => {
    it('is offered for asking or checking, not for waiting or leaving it', () => {
      expect(offersPlan('ask')).toBe(true);
      expect(offersPlan('check')).toBe(true);
      expect(offersPlan('wait')).toBe(false);
      expect(offersPlan('leave')).toBe(false);
      expect(offersPlan(null)).toBe(false);
    });
  });
});
