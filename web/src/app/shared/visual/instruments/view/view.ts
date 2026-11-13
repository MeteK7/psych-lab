import { Composed, composeScene } from '../../composition/compose';
import type { Point, Purpose } from '../../composition/scene';
import type { ThemeId } from '../../styling/vocabulary';

/**
 * "Change the camera angle" (docs/camera-angle-design.md): the moment a person goes back over, seen
 * from where they choose to look from. They step back with a native slider beside the figure, or by
 * moving the figure's own bar; the figure is drawn again from that one value.
 *
 * Its policy (docs/visual-policy.md §8):
 *
 *   Scene:      camera-angle.view@1    Area theme: cognitive@1    Tier: instrument
 *   Idea:       the same moment, seen from further back, with more around it in view.
 *   States:     one per position, 0–3, built from the exercise's value:
 *               0 close up: the moment fills the view; you aren't in it, because through your own
 *                 eyes you don't see yourself
 *               1 one step back: the whole moment, with you in it
 *               2 further: the other people come into view beside it
 *               3 furthest: the moment as one point on a line from before to after
 *   Metaphor:   a camera pulling back from the moment, drawn as one frontal view at four distances
 *               (visual-policy.md §3.4: the distance may change, the direction never does).
 *               Known weakness: a smaller moment could read as "made small", rather than "seen whole".
 *   Must:       the moment and you keep their colour and line weight at every position; what is in
 *               view at each position is exactly the list above; the moment is never narrower than a
 *               quarter of the frame; the bar stands where its scale puts the position, so the figure
 *               and the exercise's native control say the same; every change between two positions,
 *               end to end included, stays within the motion budget; token colours only, in the
 *               Cognitive theme; inside its frame.
 *   Must not:   shrink the moment to a dot, fade or grey it; make further back look better than
 *               close up; carry any of the person's own words; show a face or a figure.
 *   Motion:     each step the person takes glides (150 ms, following input): the moment, the marks
 *               and the bar move together as one reflow. You fade into view; the line from before to
 *               after is drawn left to right; the other people appear at once, as the view widens,
 *               which keeps a jump from end to end within three movements. Stepping closer, what is
 *               no longer in view goes at once.
 *   Alt texts:  the exercise gives one per position, from its content; the Lab passes fixed phrases.
 *   Assertions: `view.policy.spec.ts`.
 *   Review:     R2 in the Visual Lab, then R3 and the psychology-trained reviewer in the exercise.
 */
export const VIEW = { id: 'camera-angle.view', version: 1, theme: 'cognitive' as ThemeId } as const;

/** The positions a person can look from: 0 is close up, through their own eyes. */
export const POSITIONS = 4;
export const FURTHEST = POSITIONS - 1;

/** The figure's words, all from the exercise's content. Never the person's own. */
export interface ViewWords {
  /** The bar's name; the native slider beside the figure says the same. */
  standpoint: string;
  near: string;
  far: string;
  you: string;
  others: string;
  before: string;
  after: string;
  /** The text alternative at each position, 0–3. */
  alts: readonly string[];
}

export interface ViewInput {
  /** Where the person looks from, 0–3: the exercise's own value. */
  position: number;
  words: ViewWords;
}

// Design size, in CSS px at the figure's usual width (1 unit = 1 px).
export const VIEW_SIZE = { width: 480, height: 240 };
/** Where the camera looks: the moment's centre stays here at every distance. */
const CENTRE: Point = [240, 92];
/** How large the world is drawn at each position: the camera's distance. */
export const ZOOM = [1.65, 0.97, 0.68, 0.47] as const;
/** The moment, in world units around the centre. */
const MOMENT = { rx: 136, ry: 46 };
/** You, inside the moment, and the two other people, beside it (world units). */
const YOU: Point = [-20, 3];
const OTHERS: readonly Point[] = [
  [166, -68],
  [213, -55],
];
const YOU_R = 4;
const OTHER_R = 7;
const TRACK_Y = 200;
/** The bar's place for each position: close up at the left, furthest back at the right. */
export const POSITION_SCALE = { kind: 'linear', domain: [0, FURTHEST], range: [60, 420], step: 1 } as const;
const TIME = { x1: 40, x2: 440 };

/** Why each element is there (docs/visual-policy.md principle 6). */
export const VIEW_PURPOSES: readonly { id: string; purpose: Purpose }[] = [
  {
    id: 'moment',
    purpose: {
      serves: ['concept', 'feedback'],
      why: 'The moment itself: the same form at every distance, so stepping back shows the same moment seen whole, not a different one. It keeps its colour at every position. Close up it fills the view, as a moment does when you are in it.',
    },
  },
  {
    id: 'you',
    purpose: {
      serves: ['concept'],
      why: 'You, inside the moment. Seeing yourself in it is what makes a view an observer’s; through your own eyes you can’t, so close up it isn’t there.',
    },
  },
  {
    id: 'others-*',
    purpose: {
      serves: ['understanding'],
      why: 'The other people involved, seen from far enough back to be separate from you. Thin outlines, so they stay behind the moment.',
    },
  },
  {
    id: 'time',
    purpose: {
      serves: ['concept', 'understanding'],
      why: 'From furthest back, the moment is one point on a line with something before and after it. It runs left to right, as time does in the platform’s figures.',
    },
  },
  {
    id: 'track',
    purpose: {
      serves: ['interaction', 'understanding'],
      why: 'Where you are looking from, from close up to further back. Pressing it places the bar there, so the small bar isn’t the only place to press.',
    },
  },
  {
    id: 'standpoint',
    purpose: {
      serves: ['interaction', 'feedback'],
      why: 'The position a person sets: drag it, or press the line. It is the same value as the native slider beside the figure.',
    },
  },
  {
    id: 'label-*',
    purpose: {
      serves: ['understanding'],
      why: 'Names a part of the figure in the exercise’s own words, from its content.',
    },
  },
];

const purpose = (id: string) => VIEW_PURPOSES.find((p) => p.id === id)!.purpose;
const r1 = (n: number) => Math.round(n * 10) / 10;
/** A point of the world, as the camera at this distance draws it. */
const at = (p: Point, z: number): Point => [r1(CENTRE[0] + p[0] * z), r1(CENTRE[1] + p[1] * z)];

/** Where the bar stands for a position. */
export const standpointX = (position: number) => POSITION_SCALE.range[0] + position * ((POSITION_SCALE.range[1] - POSITION_SCALE.range[0]) / FURTHEST);

/** What is in view at a position (the policy's list). */
export function inView(position: number): { you: boolean; others: boolean; time: boolean } {
  return { you: position >= 1, others: position >= 2, time: position >= 3 };
}

export function composeView({ position, words }: ViewInput): Composed {
  const p = Math.min(Math.max(Math.round(position), 0), FURTHEST);
  const z = ZOOM[p];
  const show = inView(p);
  const [cx, cy] = CENTRE;
  const you = at(YOU, z);
  const others = OTHERS.map((o) => at(o, z));
  const label = 'label-*';
  const view = [
    ...(show.time
      ? [
          {
            kind: 'shape' as const,
            id: 'time',
            geometry: { type: 'line' as const, x1: TIME.x1, y1: cy, x2: TIME.x2, y2: cy },
            style: { role: 'context' as const, line: 'hair' as const },
            purpose: purpose('time'),
            enter: { effect: 'draw' as const, why: 'From furthest back, a line from before to after is drawn through the moment, left to right, as time runs.' },
          },
        ]
      : []),
    {
      kind: 'shape' as const,
      id: 'moment',
      geometry: { type: 'ellipse' as const, cx, cy, rx: r1(MOMENT.rx * z), ry: r1(MOMENT.ry * z) },
      style: { role: 'subject' as const, material: 'tonal' as const },
      purpose: purpose('moment'),
      moves: { why: 'Stepping back is seen as it is done: the same moment, drawn from further away with each step the person takes.' },
    },
    ...(show.you
      ? [
          {
            kind: 'shape' as const,
            id: 'you',
            geometry: { type: 'circle' as const, cx: you[0], cy: you[1], r: YOU_R },
            style: { role: 'subject' as const, material: 'solid' as const },
            purpose: purpose('you'),
            enter: { effect: 'fade' as const, why: 'One step back, you come into view in the moment: what an observer sees and you, inside it, couldn’t.' },
            moves: { why: 'You stay where you were in the moment as the view pulls back.' },
          },
        ]
      : []),
    ...(show.others
      ? others.map(([ox, oy], i) => ({
          kind: 'shape' as const,
          id: `others-${i + 1}`,
          geometry: { type: 'circle' as const, cx: ox, cy: oy, r: OTHER_R },
          style: { role: 'context' as const, line: 'fine' as const },
          purpose: purpose('others-*'),
          moves: { why: 'The others stay where they are beside the moment as the view pulls back.' },
        }))
      : []),
  ];
  const [left, right] = POSITION_SCALE.range;
  const last = others[others.length - 1];
  const labels = [
    { kind: 'label' as const, id: 'label-near', text: 'near', at: [left, TRACK_Y + 30] as Point, align: 'start' as const, names: ['track'], purpose: purpose(label) },
    { kind: 'label' as const, id: 'label-far', text: 'far', at: [right, TRACK_Y + 30] as Point, align: 'end' as const, names: ['track'], purpose: purpose(label) },
    ...(show.you
      ? [{ kind: 'label' as const, id: 'label-you', text: 'you', at: [r1(you[0] + 10), r1(you[1] + 5)] as Point, align: 'start' as const, names: ['you', 'moment'], purpose: purpose(label), enter: { with: 'you' } }]
      : []),
    ...(show.others
      ? [{ kind: 'label' as const, id: 'label-others', text: 'others', at: [r1(last[0] + 14), r1(last[1] + 5)] as Point, align: 'start' as const, names: ['others-1', 'others-2'], purpose: purpose(label) }]
      : []),
    ...(show.time
      ? [
          { kind: 'label' as const, id: 'label-before', text: 'before', at: [TIME.x1, cy + 18] as Point, align: 'start' as const, names: ['time'], purpose: purpose(label), enter: { with: 'time' } },
          { kind: 'label' as const, id: 'label-after', text: 'after', at: [TIME.x2, cy + 18] as Point, align: 'end' as const, names: ['time'], purpose: purpose(label), enter: { with: 'time' } },
        ]
      : []),
  ];
  return composeScene(
    {
      id: VIEW.id,
      version: VIEW.version,
      theme: VIEW.theme,
      size: VIEW_SIZE,
      scales: { position: POSITION_SCALE },
      layers: [
        { id: 'view', plane: 'subject', elements: view },
        {
          id: 'standpoint',
          plane: 'annotation',
          elements: [
            { kind: 'shape', id: 'track', geometry: { type: 'line', x1: left, y1: TRACK_Y, x2: right, y2: TRACK_Y }, style: { role: 'context', line: 'hair' }, purpose: purpose('track') },
            ...labels,
          ],
        },
        {
          id: 'bar',
          plane: 'subject',
          elements: [
            {
              kind: 'shape',
              id: 'standpoint',
              geometry: { type: 'rect', x: standpointX(p) - 3, y: TRACK_Y - 10, width: 6, height: 20, rx: 3 },
              style: { role: 'subject', material: 'solid' },
              purpose: purpose('standpoint'),
              moves: { why: 'It follows the position a person sets, quickly, so each step can be seen.' },
              target: { kind: 'handle', x: { scale: 'position', value: 'position' }, track: 'track', label: 'standpoint' },
            },
          ],
        },
      ],
      alt: words.alts[p] ?? '',
    },
    { standpoint: words.standpoint, near: words.near, far: words.far, you: words.you, others: words.others, before: words.before, after: words.after },
  );
}
