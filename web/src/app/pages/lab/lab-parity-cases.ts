import { Composed, SHOWN, lookupOf } from '../../shared/visual/composition/compose';
import { composeCauseMap } from '../../shared/visual/instruments/cause-map/cause-map';
import { composeGuideDays } from '../../shared/visual/instruments/guide-days/guide-days';
import { composeRounds } from '../../shared/visual/instruments/rounds/rounds';
import { composeTracking, composeTrackingPreview } from '../../shared/visual/instruments/tracking/tracking';
import { LiveInput, buildChangeTimeline, buildComposedFrame, buildFrame, buildTimeline } from '../../shared/visual/integration/pipeline';
import type { ResolvedFrame, ResolvedTimeline } from '../../shared/visual/integration/frame-figure';
import { SCENES } from '../../shared/visual/scenes';
import { resolveStyle } from '../../shared/visual/styling/resolve';
import { INPUT_CHANGE, THEMES, ThemeId } from '../../shared/visual/styling/vocabulary';
import { LAYOUTS, referenceCompositions } from './lab-generators';
import { CAUSE_AXES, CAUSE_SETS, PREVIEW_LABELS, RING_RADIUS, ROUNDS_TOTAL, ROUND_SETS, trackingStill } from './lab-instrument-sets';
import { choiceFigure, fieldFigure, ratingFigure } from './lab-interaction-figures';
import { MATERIALS_REFERENCES } from './lab-materials';
import { BAR_SETS, barsFigure, routeFigure, setFigure } from './lab-motion-figures';
import { AREAS, depthFigure, linesFigure, materialsFigure, typeFigure } from './lab-sheet-figures';

/**
 * The parity suite's cases (milestone M6): every scene state, every instrument answer set and every
 * Lab reference as a still frame, and a change of each kind as a timeline, drawn by the SVG and the
 * canvas backend side by side (docs/visual-system.md §6.2). Built once, from the same functions the
 * Lab and the exercises use.
 */
export interface ParityCase {
  key: string;
  group: string;
  name: string;
  frame: ResolvedFrame;
  /** A change to play, towards `frame`; none for a still frame. */
  timeline?: ResolvedTimeline;
  /**
   * What the frame is, for export (M7): the composition or scene state it was built from, and its
   * text alternative. Absent where the frame isn't one (a moment of interaction, the fill swatches).
   */
  source?: ExportSource;
}

/** What an exported file records about its origin; the scheme and theme version are added on export. */
export interface ExportSource {
  id: string;
  version: number;
  state?: string;
  seed?: string;
  alt: string;
}

const still = (key: string, group: string, name: string, frame: ResolvedFrame): ParityCase => ({ key, group, name, frame });
const composed = (key: string, group: string, name: string, c: Composed, live?: LiveInput): ParityCase =>
  live
    ? still(key, group, name, buildFrame(c.scene, SHOWN, lookupOf(c), live))
    : {
        ...still(key, group, name, buildComposedFrame(c)),
        source: { id: c.scene.id, version: c.scene.version, ...(c.scene.seed ? { seed: c.scene.seed } : {}), alt: c.text['alt'] ?? '' },
      };

/** A change between two compositions of one figure, as the scene figure or the interactive figure plays it. */
function change(key: string, group: string, name: string, before: Composed, after: Composed, input = false, live?: LiveInput): ParityCase {
  return {
    key,
    group,
    name,
    frame: buildFrame(after.scene, SHOWN, lookupOf(after), live),
    timeline: buildChangeTimeline(before.scene, after.scene, SHOWN, lookupOf(after), 'full', input ? { pace: INPUT_CHANGE, live } : { live }),
  };
}

/** Every colour a fill can take, as large swatches, and the two gradient fills: the suite measures rendering noise here. */
export const FILL_TOKENS = [
  'ground', 'far', 'far-edge', 'mid', 'mid-edge', 'near', 'near-edge', 'subject-fill', 'subject', 'context', 'ink',
  'receded', 'receded-fill', 'subject-lit', 'subject-shade', 'translucent', 'overlap',
] as const;

function swatches(theme: ThemeId): ResolvedFrame {
  const items: ResolvedFrame['items'] = FILL_TOKENS.map((token, i) => ({
    kind: 'shape',
    id: `swatch-${token}`,
    layer: 'swatches',
    shape: { type: 'rect', x: 10 + (i % 6) * 100, y: 10 + Math.floor(i / 6) * 70, width: 90, height: 60 },
    paint: { fill: `var(--vis-${token})`, stroke: 'none', width: 0, dash: null },
  }));
  const lit = resolveStyle({ role: 'subject', material: 'lit' });
  const shadow = resolveStyle({ role: 'subject', material: 'shadow' });
  return {
    width: 620,
    height: 300,
    theme,
    items: [
      ...items,
      { kind: 'shape', id: 'gradient-lit', layer: 'swatches', shape: { type: 'rect', x: 210, y: 220, width: 190, height: 70 }, paint: { ...lit, stroke: 'none', width: 0, gradient: { ...lit.gradient!, box: { x: 210, y: 220, width: 190, height: 70 } } } },
      { kind: 'shape', id: 'gradient-shadow', layer: 'swatches', shape: { type: 'ellipse', cx: 510, cy: 255, rx: 95, ry: 35 }, paint: { ...shadow, gradient: { ...shadow.gradient!, box: { x: 415, y: 220, width: 190, height: 70 } } } },
    ],
  };
}

/** The bar's name in the worked example (an exercise takes it from its content). */
const GUIDE_BAR = 'Days you plan to practise';

export function parityCases(): ParityCase[] {
  const cases: ParityCase[] = [];
  for (const theme of Object.keys(THEMES) as ThemeId[]) cases.push(still(`calibration.${theme}`, 'Fill colours', `Every fill colour, ${theme}`, swatches(theme)));
  for (const { scene, text } of SCENES) {
    for (const state of Object.keys(scene.states.states))
      cases.push({
        ...still(`${scene.id}.${state}`, 'Scenes', `${scene.id}, ${state}`, buildFrame(scene, state, text)),
        source: { id: scene.id, version: scene.version, state, ...(scene.seed ? { seed: scene.seed } : {}), alt: text(scene.alt[state]) ?? '' },
      });
    for (const [from, to] of scene.transitions ?? [])
      cases.push({
        key: `${scene.id}.${from}-${to}`,
        group: 'Changes',
        name: `${scene.id}: ${from} → ${to}`,
        frame: buildFrame(scene, to, text),
        timeline: buildTimeline(scene, from, to, 'full', text),
      });
  }
  for (const set of CAUSE_SETS)
    cases.push(composed(`cause-map.${set.key}`, 'Instruments', `cs2.cause-map: ${set.name}`, composeCauseMap({ causes: set.causes, placing: set.placing, axes: CAUSE_AXES })));
  for (const set of ROUND_SETS) cases.push(composed(`rounds.${set.current}`, 'Instruments', `state-reset.rounds: ${set.name}`, composeRounds({ total: ROUNDS_TOTAL, current: set.current })));
  cases.push(composed('tracking.preview', 'Instruments', 'state-reset.tracking: the preview', composeTrackingPreview({ ringRadius: RING_RADIUS, labels: PREVIEW_LABELS })));
  for (const onTarget of [false, true])
    cases.push(composed(`tracking.${onTarget ? 'inside' : 'outside'}`, 'Instruments', `state-reset.tracking: the game, pointer ${onTarget ? 'inside' : 'outside'} the ring`, composeTracking(trackingStill(onTarget))));
  // The authoring guide's worked example, as still frames and as a change of number (the bar glides).
  for (const days of [0, 3, 7]) cases.push(composed(`guide.days.${days}`, 'Instruments', `reference.guide.days: ${days} of 7 days`, composeGuideDays({ days, barLabel: GUIDE_BAR })));
  cases.push(change('change.guide-days', 'Changes', 'reference.guide.days: a day added (the bar glides, a mark fills)', composeGuideDays({ days: 3, barLabel: GUIDE_BAR }), composeGuideDays({ days: 4, barLabel: GUIDE_BAR }), true));
  referenceCompositions().forEach((c, i) => cases.push(composed(`generators.${i}.${c.scene.id}`, 'Generators', c.scene.id, c)));
  for (const l of LAYOUTS) cases.push(composed(`layouts.${l.id}`, 'Layouts', l.name, l.composed));
  for (const m of MATERIALS_REFERENCES) cases.push(composed(`materials.${m.id}`, 'Materials', m.name, m.composed));
  cases.push(composed('sheet.lines', 'Review sheet', 'Lines and dashes', linesFigure()));
  cases.push(composed('sheet.type', 'Review sheet', 'Type', typeFigure()));
  for (const a of AREAS) {
    cases.push(composed(`sheet.materials.${a.theme}`, 'Review sheet', `Materials, ${a.name}`, materialsFigure(a.theme)));
    cases.push(composed(`sheet.depth.${a.theme}`, 'Review sheet', `Depth, ${a.name}`, depthFigure(a.theme)));
  }
  cases.push(composed('interaction.rating', 'Interaction', 'A mark on a scale', ratingFigure(3)));
  cases.push(composed('interaction.rating-focus', 'Interaction', 'A mark on a scale, with the focus ring, being moved', ratingFigure(3), { focus: 'mark', emphasis: { mark: 'focal' } }));
  cases.push(composed('interaction.field', 'Interaction', 'A mark in a field', fieldFigure(2, 4)));
  cases.push(composed('interaction.choice', 'Interaction', 'One of three options', choiceFigure('second')));
  cases.push(composed('motion.bars', 'Motion', 'Bars', barsFigure(BAR_SETS[0])));
  cases.push(composed('motion.set', 'Motion', 'A set', setFigure(5)));
  cases.push(composed('motion.route', 'Motion', 'A route', routeFigure(4)));
  // Changes of data and of input: every kind of track.
  cases.push(change('change.bars', 'Changes', 'Bars: new values (shapes glide, labels move)', barsFigure(BAR_SETS[0]), barsFigure(BAR_SETS[1])));
  cases.push(change('change.set-add', 'Changes', 'A set: a member added (enters; the outline crossfades)', setFigure(4), setFigure(5)));
  cases.push(change('change.set-remove', 'Changes', 'A set: a member removed (fades out)', setFigure(5), setFigure(4)));
  cases.push(change('change.route-add', 'Changes', 'A route: a stop added (a leg drawn)', routeFigure(3), routeFigure(4)));
  cases.push(change('change.route-remove', 'Changes', 'A route: a stop removed (a leg taken back)', routeFigure(4), routeFigure(3)));
  cases.push(change('change.rating', 'Changes', 'A mark stepped by a key (quick glide, focus ring with it)', ratingFigure(3), ratingFigure(4), true, { focus: 'mark' }));
  cases.push(change('change.choice', 'Changes', 'An option chosen (colours ease)', choiceFigure('second'), choiceFigure('third'), true));
  return cases;
}
