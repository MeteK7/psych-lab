import {
  canAct,
  changeOrder,
  firstReadingClose,
  fitNote,
  highUpset,
  noticedRecord,
  offersPlan,
  reflections,
  stayedClose,
} from './cs-logic';

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

  describe('Change the camera angle', () => {
    it('notes a high upset rating from 8, and never otherwise', () => {
      expect(highUpset(null)).toBe(false);
      expect(highUpset(7)).toBe(false);
      expect(highUpset(8)).toBe(true);
      expect(highUpset(10)).toBe(true);
    });

    it('takes position 0 as staying close, and any step back as the observer path', () => {
      expect(stayedClose(0)).toBe(true);
      for (const p of [1, 2, 3]) expect(stayedClose(p)).toBe(false);
    });

    it('suggests a plan only when the person can do something about it', () => {
      expect(canAct('yes')).toBe(true);
      expect(canAct('partly')).toBe(true);
      expect(canAct('no')).toBe(false);
      expect(canAct(null)).toBe(false);
    });

    it('records what was noticed by id, in screen order, and only that an own one was added', () => {
      const order = ['led_up', 'that_day', 'nothing'];
      expect(noticedRecord(order, ['nothing', 'led_up'], '')).toEqual(['led_up', 'nothing']);
      expect(noticedRecord(order, [], 'PRIVATE words')).toEqual(['own']);
      expect(noticedRecord(order, ['stale'], '   ')).toEqual([]);
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
