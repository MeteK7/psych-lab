import type { ReviewedAccount } from './map';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The mapping's first
 * test inputs: three reviewed corpus accounts (docs/visual-study/corpus-*.md, pass A), typed for the
 * mapping. None of them is a text of the human trial's slice 1, the sealed held-out set or any trial
 * material, and none is ever sent to a model (the run script refuses corpus texts).
 *
 * How they were typed:
 * - Each row's id, statement, category and basis are the corpus table's, unchanged. A spec checks it.
 * - Each predicate form is the one pass A's representation gives that row, where it gives one. A row
 *   pass A gave no form keeps none, and a form pass A gave with no row isn't added.
 * - Elements are pass A's. Where pass A named a thing only inside a predicate, or gave a count the
 *   contract words differently, the case's `source` says what was added.
 * - Pass A's accounts were written in sessions and reviewed in the visual study. The proposal treats
 *   them as earlier AI-authored material, so a match with them is consistency, not correctness.
 */
export const MAPPING_CASES: readonly ReviewedAccount[] = [
  {
    id: 'P-CS3-4',
    text: 'In a group chat, your suggestion gets no reactions.',
    source: 'corpus-psychology.md, P-CS3-4 `no_reactions` (pass A). Typed: `group` given count `several` (pass A: "plural", a number not stated; the contract has no plural without a count)',
    elements: [
      { id: 'own', kind: 'presence', own: true },
      { id: 'group', kind: 'presence', count: 'several' },
      { id: 'suggestion', kind: 'object' },
    ],
    statements: [
      { id: 'R1', statement: 'Own\'s suggestion in a group chat got no reactions', category: 'R', basis: 'the sentence', say: { p: 'exchange-absent', kind: 'reaction', from: 'group', to: 'own' } },
      // Pass A's s1. Its basis is a presupposition no row of the registry covers.
      { id: 'L1', statement: 'Own made a suggestion to a group', category: 'L', basis: 'presupposition of "your suggestion"', say: { p: 'sends', from: 'own', item: 'suggestion', to: 'group' } },
      { id: 'I1', statement: 'People read it', category: 'I', basis: 'not stated' },
      { id: 'I2', statement: 'People disliked it', category: 'I', basis: 'the feared reading' },
      { id: 'U1', statement: 'Whether people read it', category: 'U', basis: 'not stated', say: { p: 'question', about: 'group', asks: 'attention' } },
      { id: 'U2', statement: 'What they think of it', category: 'U', basis: 'not stated' },
      // Pass A's a1 asks pass A's q2 (why there were no reactions), which has no row in the account.
      { id: 'P', statement: 'buried · bad_idea · waiting · unclear · agree', category: 'P', basis: 'reviewed readings', say: { p: 'alternatives', question: 'q2', options: ['buried', 'bad_idea', 'waiting', 'unclear', 'agree'], origin: 'content' } },
    ],
  },
  {
    id: 'M-2',
    text: 'The app, the website and the training material all need to be ready for the launch on 3 March.',
    source: 'corpus-planning.md, M-2 three workstreams converging (pass A). Typed as pass A gives it',
    elements: [
      { id: 'app', kind: 'process' },
      { id: 'website', kind: 'process' },
      { id: 'training', kind: 'process' },
      { id: 'launch', kind: 'process' },
    ],
    statements: [
      // A fixed date has no predicate (G-02).
      { id: 'R1', statement: 'The launch is on 3 March', category: 'R', basis: '' },
      {
        id: 'R2',
        statement: 'The launch depends on the app, the website and the training material being ready',
        category: 'R',
        basis: '',
        say: [
          { p: 'depends-on', what: 'launch', on: 'app' },
          { p: 'depends-on', what: 'launch', on: 'website' },
          { p: 'depends-on', what: 'launch', on: 'training' },
        ],
      },
      {
        id: 'U1',
        statement: 'How ready each is now',
        category: 'U',
        basis: '',
        say: [
          { p: 'question', about: 'app', asks: 'state' },
          { p: 'question', about: 'website', asks: 'state' },
          { p: 'question', about: 'training', asks: 'state' },
        ],
      },
    ],
  },
  {
    id: 'E-8',
    text: "Many people think summer is warmer because the Earth is closer to the Sun then. In fact it's because of the tilt of the Earth's axis, which makes sunlight fall more directly on one hemisphere.",
    source: 'corpus-education.md, E-8 a misconception and the established account (pass A). Typed: `people` given count `many` ("many people"); `nearness`, `warmth` and `tilt` declared as qualities (pass A names them only inside its predicates)',
    elements: [
      { id: 'earth', kind: 'object' },
      { id: 'sun', kind: 'object' },
      { id: 'axis', kind: 'object' },
      { id: 'hemisphere', kind: 'place' },
      { id: 'people', kind: 'presence', count: 'many' },
      { id: 'nearness', kind: 'quality' },
      { id: 'warmth', kind: 'quality' },
      { id: 'tilt', kind: 'quality' },
    ],
    statements: [
      { id: 'R1', statement: 'Many people believe summer is warmer because the Earth is closer to the Sun', category: 'R', basis: 'a belief, attributed', say: { p: 'believes', who: 'people', statement: 'R2' } },
      // Pass A's b1: the belief's content, which the source denies.
      { id: 'R2', statement: 'The source denies that belief', category: 'R', basis: '"in fact"', say: { p: 'causes', cause: 'nearness', effect: 'warmth' }, denied: true },
      { id: 'R3', statement: "Summer is warmer because of the axis's tilt", category: 'R', basis: '', say: { p: 'causes', cause: 'tilt', effect: 'warmth' } },
      // "directness" is not a predicate of the contract.
      { id: 'R4', statement: 'The tilt makes sunlight fall more directly on one hemisphere', category: 'R', basis: '', say: { p: 'directness', what: 'sunlight', on: 'hemisphere' } },
    ],
  },
];

/**
 * The second step's inputs: three reviewed corpus accounts with more than one phase, typed the same
 * way. Pass A's phases are kept as pass A gives them, and **a statement pass A gave no phase is left
 * unstated** (your decision, 2026-11-26). Nothing is phased by tense or word order here, so such a
 * statement is a gap: the mapping won't let it hold in every phase by default.
 */
export const MAPPING_TIME_CASES: readonly ReviewedAccount[] = [
  {
    id: 'E-3',
    text: 'Three of the five slices of the pizza have been eaten; two are left.',
    source: 'corpus-education.md, E-3 a fraction (pass A). Typed: `slice` given count 5 (pass A: "plural (five)"). Pass A\'s "slice × 3" and "slice × 2" are kept as written: they are some of the slices, which no declared element names',
    time: { phases: ['before', 'after'] },
    elements: [
      { id: 'pizza', kind: 'object' },
      { id: 'slice', kind: 'object', count: 5 },
    ],
    statements: [
      // Pass A's s1 has no phase: under the contract, five slices in every phase, "after" too.
      { id: 'R1', statement: 'The pizza had five slices', category: 'R', basis: '', say: { p: 'part-of', part: 'slice', whole: 'pizza' } },
      { id: 'R2', statement: 'Three have been eaten', category: 'R', basis: '', say: { p: 'absent', what: 'slice × 3' }, phases: ['after'] },
      { id: 'R3', statement: 'Two are left', category: 'R', basis: '', say: { p: 'present', what: 'slice × 2' }, phases: ['after'] },
      { id: 'I1', statement: 'The slices are equal', category: 'I', basis: "fractions assume it; the text doesn't say" },
    ],
  },
  {
    id: 'E-7',
    text: 'The First World War began after decades of rivalry between alliances, an arms race, and the assassination of Archduke Franz Ferdinand in 1914.',
    source: 'corpus-education.md, E-7 several causes of one event (pass A). Typed: pass A\'s inferred causes(s1–s3, war) as one cause per event (the events are the elements pass A declares)',
    time: { phases: ['decades', '1914', 'the war'] },
    elements: [
      { id: 'rivalry', kind: 'process' },
      { id: 'arms-race', kind: 'process' },
      { id: 'assassination', kind: 'process' },
      { id: 'war', kind: 'process' },
    ],
    statements: [
      { id: 'R1', statement: 'There were decades of rivalry between alliances', category: 'R', basis: '' },
      { id: 'R2', statement: 'There was an arms race', category: 'R', basis: '' },
      { id: 'R3', statement: 'The Archduke was assassinated in 1914', category: 'R', basis: '' },
      {
        id: 'R4',
        statement: 'The war began after these',
        category: 'R',
        basis: '',
        say: [
          { p: 'precedes', a: 'rivalry', b: 'war' },
          { p: 'precedes', a: 'arms-race', b: 'war' },
          { p: 'precedes', a: 'assassination', b: 'war' },
        ],
      },
      {
        id: 'I1',
        statement: 'They caused the war',
        category: 'I',
        basis: '**"after" licenses order only**',
        say: [
          { p: 'causes', cause: 'rivalry', effect: 'war' },
          { p: 'causes', cause: 'arms-race', effect: 'war' },
          { p: 'causes', cause: 'assassination', effect: 'war' },
        ],
      },
    ],
  },
  {
    id: 'P-CS3-1',
    text: "Your teacher writes 'Come and see me after class' on your assignment.",
    source: 'corpus-psychology.md, P-CS3-1 `teacher_note` (pass A). Typed: `note` declared as an object (pass A names it only inside its predicates). Pass A phases s1 "now" but not s2, and R1 holds both, so R1 is left unstated',
    time: { phases: ['now', 'after class'] },
    elements: [
      { id: 'own', kind: 'presence', own: true },
      { id: 'teacher', kind: 'presence' },
      { id: 'assignment', kind: 'object', salience: 'secondary' },
      { id: 'meeting', kind: 'process' },
      { id: 'note', kind: 'object' },
    ],
    statements: [
      {
        id: 'R1',
        statement: "The teacher wrote a note on own's assignment",
        category: 'R',
        basis: '"writes … on your assignment"',
        say: [
          { p: 'sends', from: 'teacher', item: 'note', to: 'own' },
          { p: 'located-in', what: 'note', place: 'assignment' },
        ],
      },
      // Pass A's s3: a request, not an event that took place (G-01).
      { id: 'R2', statement: 'The note asks own to come and see the teacher after class', category: 'R', basis: 'the quoted words', say: { p: 'pending', what: 'meeting' } },
      { id: 'L1', statement: 'Own has an assignment the teacher has seen', category: 'L', basis: 'presupposition of "your assignment"' },
      { id: 'I1', statement: 'The note is about the assignment', category: 'I', basis: "it is written on it; the text doesn't say what it is about" },
      { id: 'I2', statement: 'Something is wrong', category: 'I', basis: 'the feared reading, not stated' },
      { id: 'U1', statement: 'What the teacher wants to talk about', category: 'U', basis: 'not stated', say: { p: 'question', about: 'meeting', asks: 'content' } },
      { id: 'U2', statement: 'Why in person rather than in writing', category: 'U', basis: 'not stated' },
      { id: 'P', statement: 'in_person · bad_grade · several · fix · liked', category: 'P', basis: 'reviewed readings', say: { p: 'alternatives', question: 'U1', options: ['in_person', 'bad_grade', 'several', 'fix', 'liked'], origin: 'content' } },
    ],
  },
];
