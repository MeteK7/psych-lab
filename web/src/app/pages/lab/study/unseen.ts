import type { StudyCase } from './cases';
import { U2, U3, U4 } from './unseen-blind';
import { U5, U6, U7 } from './unseen-blind-2';
import { U8, U9, U10 } from './unseen-blind-3';

/**
 * STUDY CODE, pass C step 3: a representation the rules have never seen. Written on 2026-11-21 after
 * the rules were frozen at revision 4 (R4-4 left at `constant`), in pass A's conventions, before it
 * was drawn. It is run through all three idioms with no change to their code; every failure or poor
 * figure is a finding (findings-pass-c.md §3). Not in CASES: it is not part of the corpus.
 *
 * Chosen to be outside the corpus's domains (physics, for education) while using predicates the
 * rules already have: movement (`flows`), `above`, `contact`, `displaced`, and an open question.
 *
 * Revision 5 brought it to v0.2 by adding three `form` statements (f1–f3), licensed by its nouns;
 * nothing else in it changed. Pass C's finding stands for v0.1 (findings-pass-c.md §3).
 */
export const U1: StudyCase = {
  id: 'U1',
  domain: 'education',
  source: 'Pass C: written for the study after the rules were frozen (physics)',
  text: 'A ball rolls down a ramp and hits a box at the bottom, which slides across the floor.',
  theme: 'attention',
  words: { ball: 'Ball', ramp: 'Ramp', box: 'Box', floor: 'Floor' },
  rep: {
    v: 1,
    id: 'U1',
    elements: [
      { id: 'ball', kind: 'object', salience: 'primary' },
      { id: 'ramp', kind: 'place' },
      { id: 'box', kind: 'object' },
      { id: 'floor', kind: 'place' },
    ],
    statements: [
      { id: 's1', say: { p: 'flows', what: 'ball', from: 'ramp', to: 'floor' }, commitment: 'reported', phases: ['roll'], basis: '“rolls down a ramp … at the bottom”' },
      { id: 'ab1', say: { p: 'above', a: 'ramp', b: 'floor' }, commitment: 'implied', basis: '“down a ramp”: what goes down from X to Y licenses X above Y (as E2)' },
      { id: 's2', say: { p: 'contact', a: 'ball', b: 'box' }, commitment: 'reported', phases: ['hit'], basis: '“hits a box”' },
      { id: 's3', say: { p: 'displaced', what: 'box', by: 'ball' }, commitment: 'reported', phases: ['slide'], basis: '“which slides across the floor”: moved by the hit, not of itself' },
      // v0.2 (revision 5): forms, licensed by the nouns (representation-v0.md §5, L-form, under review).
      { id: 'f1', say: { p: 'form', what: 'ball', feature: 'round' }, commitment: 'implied', basis: '“a ball”: the noun fixes the form (L-form)' },
      { id: 'f2', say: { p: 'form', what: 'box', feature: 'block' }, commitment: 'implied', basis: '“a box”: the noun fixes the form (L-form)' },
      { id: 'f3', say: { p: 'form', what: 'ramp', feature: 'slope' }, commitment: 'implied', basis: '“a ramp”: the noun fixes the form (L-form)' },
      { id: 'i1', say: { p: 'intends', who: 'ball', what: 'stops at the box' }, commitment: 'inferred', basis: 'that the ball stops: not stated' },
      { id: 'q1', say: { p: 'question', about: 'box', asks: 'fate' }, commitment: 'unknown', basis: 'how far the box slides, and where it ends: not stated' },
    ],
    time: { phases: ['roll', 'hit', 'slide'] },
    facets: {
      space: { setting: 'reported', place: 'ground', viewpoints: ['front', 'side'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'agitation', source: 's2', evolves: true },
    },
  },
};

/** Revision 5: every unseen case, shown in the Lab under "Unseen cases" (`?unseen=1`). */
export const UNSEEN: readonly StudyCase[] = [U1, U2, U3, U4, U5, U6, U7, U8, U9, U10];
