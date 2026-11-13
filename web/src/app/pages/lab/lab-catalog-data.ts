/**
 * The Visual System's catalog (milestone M8, S10): every capability, the milestone it came from,
 * where the Visual Lab shows it, and the tests that cover it. A spec (lab-catalog.spec.ts) keeps it
 * complete: every generator, layout, material, line weight, dash, entrance, departure, frame,
 * theme, colour role, label tone, scene, instrument and backend the system has must be covered by
 * a row here, every anchor must exist in the Lab, and every test file must exist.
 */

/** A place in the Lab: a section on the Lab page (its heading's id), or another Lab page. */
export type Where = { anchor: string; label: string } | { route: string; label: string };

export interface Capability {
  name: string;
  what: string;
  /** The named things it covers, as `<kind>:<name>` (checked against the system's own lists). */
  covers?: readonly string[];
  /** The milestone or release that built it. */
  since: string;
  where: Where;
  /** Test files, from the web project's root. */
  tests: readonly string[];
}

export interface Subsystem {
  id: string;
  name: string;
  capabilities: readonly Capability[];
}

const V = 'src/app/shared/visual';
const LAB = 'e2e/visual-lab.spec.ts';
const PARITY = 'e2e/visual-parity.spec.ts';

const at = (anchor: string, label: string): Where => ({ anchor, label });
const SCENES_AT = at('lab-mcii-path', 'mcii.path');
const SHEET = at('lab-sheet', 'Review sheet');
const MATERIALS_AT = at('lab-materials', 'Materials and light');
const INTERACTION = at('lab-interaction', 'Interaction');
const MOTION_AT = at('lab-motion', 'Motion between values');
const ASSETS_AT = at('lab-assets', 'Assets');
const PARITY_PAGE: Where = { route: '/lab/parity', label: 'Rendering parity (its own page)' };

/** The Lab page's sections, in order: the contents list. */
export const SECTIONS: readonly Where[] = [
  SCENES_AT,
  at('lab-instruments', 'cs2.cause-map'),
  at('lab-rounds', 'state-reset.rounds'),
  at('lab-tracking', 'state-reset.tracking'),
  at('lab-generators', 'Generators'),
  at('lab-layouts', 'Layouts'),
  MATERIALS_AT,
  INTERACTION,
  MOTION_AT,
  at('lab-stimulus', 'Stimulus lane'),
  ASSETS_AT,
  SHEET,
  at('lab-guide', 'Worked example: reference.guide.days'),
  at('lab-view', 'camera-angle.view'),
  at('lab-catalog', 'Catalog of capabilities'),
  PARITY_PAGE,
];

export const CATALOG: readonly Subsystem[] = [
  {
    id: 'S1',
    name: 'Styling',
    capabilities: [
      {
        name: 'Colour tokens and roles',
        what: 'A neutral ramp and five area ramps; roles set per scheme (light, dark) and mapped to system colours in forced colours; contrast checked for every pair a scene may use.',
        covers: ['theme:action', 'theme:cognitive', 'theme:attention', 'theme:regulation', 'theme:recovery', 'role:ground', 'role:far', 'role:mid', 'role:near', 'role:subject', 'role:context', 'role:ink'],
        since: 'v0.1',
        where: SHEET,
        tests: [`${V}/styling/styling.spec.ts`, LAB],
      },
      {
        name: 'Line weights and dashes',
        what: 'Five weights that keep their width at any figure size; dashes that carry meaning only.',
        covers: ['line:hair', 'line:fine', 'line:regular', 'line:strong', 'line:bold', 'dash:intended', 'dash:tentative'],
        since: 'v0.1',
        where: SHEET,
        tests: [`${V}/styling/styling.spec.ts`],
      },
      {
        name: 'Materials and light',
        what: 'Line, tonal and solid; lit (shaded along the one platform light), translucent with its defined overlap, and contact shadow; flattened in forced colours.',
        covers: ['material:line', 'material:tonal', 'material:solid', 'material:lit', 'material:translucent', 'material:overlap', 'material:shadow'],
        since: 'M3',
        where: MATERIALS_AT,
        tests: [`${V}/composition/materials.spec.ts`, `${V}/styling/styling.spec.ts`],
      },
      {
        name: 'Depth planes and grain',
        what: 'Planes filled without an outline, only their top edge drawn; a faint grain over the ground and planes.',
        since: 'M3',
        where: MATERIALS_AT,
        tests: [`${V}/composition/materials.spec.ts`, `${V}/integration/pipeline.spec.ts`],
      },
      {
        name: 'Type in figures',
        what: 'Two label tones; labels wrap within a width, take a halo over a plane, and are checked for clearance from forms they don’t name.',
        covers: ['tone:label', 'tone:label-soft'],
        since: 'M3',
        where: SHEET,
        tests: [`${V}/styling/type.spec.ts`, `${V}/composition/spacing.spec.ts`],
      },
      {
        name: 'Emphasis and the focus ring',
        what: 'Focal, normal and receded, resolved to weight and colour (hope-bearing elements keep their colour); a focus ring in the page’s own focus colour.',
        since: 'v0.1, M4',
        where: SCENES_AT,
        tests: [`${V}/styling/styling.spec.ts`, `${V}/integration/pipeline.spec.ts`],
      },
    ],
  },
  {
    id: 'S2',
    name: 'Generation',
    capabilities: [
      {
        name: 'Generators',
        what: 'Seeded, pure geometry: organic forms, ridges and bands, curves, flow lines and contours from noise fields, scattered and gridded dots, lenses.',
        covers: ['generator:form.blob', 'generator:form.ridge', 'generator:form.band', 'generator:curve.rhythm', 'generator:curve.arc', 'generator:field.flow', 'generator:field.contours', 'generator:dots.scatter', 'generator:dots.grid', 'generator:curve.lens'],
        since: 'M2',
        where: at('lab-generators', 'Generators'),
        tests: [`${V}/generation/generation.spec.ts`, 'src/app/pages/lab/lab-generators.spec.ts'],
      },
      {
        name: 'Layouts',
        what: 'Places for the parts of a figure built from data: a grid, a ring, rows that wrap, packed circles.',
        covers: ['layout:gridLayout', 'layout:radialLayout', 'layout:flowLayout', 'layout:packCircles'],
        since: 'M2',
        where: at('lab-layouts', 'Layouts'),
        tests: [`${V}/generation/layouts.spec.ts`],
      },
    ],
  },
  {
    id: 'S3',
    name: 'Composition',
    capabilities: [
      {
        name: 'The scene specification and its validator',
        what: 'A figure as data: layers of shapes, generated forms and labels with a purpose each, in a named frame; the validator checks every rule the policy sets.',
        covers: ['frame:banner', 'frame:wide', 'frame:standard', 'frame:square'],
        since: 'v0.1',
        where: SCENES_AT,
        tests: [`${V}/composition/validate.spec.ts`],
      },
      {
        name: 'Scenes with states',
        what: 'An illustration with named states, a text alternative per state, and the changes its exercise makes.',
        covers: ['scene:mcii.path'],
        since: 'v0.1',
        where: SCENES_AT,
        tests: [`${V}/scenes/action/mcii-path.policy.spec.ts`, LAB],
      },
      {
        name: 'Figures built from data (instruments)',
        what: 'A pure function from an exercise’s data to a figure, through the same pipeline as a scene: the cause map, the rounds, the dot game’s preview, the authoring guide’s worked example, and the camera angle’s view. Each records what it drew as `instrument:<id>@<version>;theme:<theme>@<version>`.',
        covers: ['instrument:cause-map', 'instrument:rounds', 'instrument:tracking-preview', 'instrument:guide-days', 'instrument:view'],
        since: 'v0.2, M1',
        where: at('lab-instruments', 'cs2.cause-map'),
        tests: [`${V}/instruments/cause-map/cause-map.policy.spec.ts`, `${V}/instruments/rounds/rounds.policy.spec.ts`, `${V}/instruments/tracking/tracking.policy.spec.ts`, `${V}/instruments/guide-days/guide-days.policy.spec.ts`, `${V}/instruments/view/view.policy.spec.ts`],
      },
    ],
  },
  {
    id: 'S4',
    name: 'State',
    capabilities: [
      {
        name: 'Visibility and emphasis per state',
        what: 'A named state turned into a target for every element, with no notion of time.',
        since: 'v0.1',
        where: SCENES_AT,
        tests: [`${V}/state/resolve-state.spec.ts`],
      },
    ],
  },
  {
    id: 'S5',
    name: 'Motion',
    capabilities: [
      {
        name: 'Entrances and emphasis changes',
        what: 'An element that appears fades, rises or is drawn, with a reason; an element that stays eases between emphases; at most three movements a change.',
        covers: ['enter:fade', 'enter:rise', 'enter:draw'],
        since: 'v0.1',
        where: SCENES_AT,
        tests: [`${V}/motion/plan-motion.spec.ts`, LAB],
      },
      {
        name: 'Departures',
        what: 'An element that leaves fades or is taken back along its direction, with a reason; otherwise it goes at once.',
        covers: ['exit:fade', 'exit:undraw'],
        since: 'M5',
        where: MOTION_AT,
        tests: [`${V}/motion/plan-motion.spec.ts`, `${V}/motion/plan-change.spec.ts`],
      },
      {
        name: 'Motion between values',
        what: 'In a figure built from data, marked elements glide to their new shape, place and colour as one movement; labels follow; a new change carries on from where things are.',
        since: 'M5',
        where: MOTION_AT,
        tests: [`${V}/motion/plan-change.spec.ts`, `${V}/rendering/conformance.spec.ts`, LAB],
      },
      {
        name: 'Motion that follows input, reduced motion and the watchdog',
        what: 'A quick glide after a person’s own step; nothing moves under reduced motion; a figure that draws below 50 fps for a second of motion shows its changes at once.',
        since: 'M5, M6',
        where: INTERACTION,
        tests: [`${V}/rendering/frame-stats.spec.ts`, LAB],
      },
    ],
  },
  {
    id: 'S6',
    name: 'Interaction',
    capabilities: [
      {
        name: 'Scales, targets and hit testing',
        what: 'A value to a position and back, snapped and held at its ends; handles with their tracks and regions; the target under a point from the real outlines, small targets counted 24 × 24.',
        since: 'M4',
        where: INTERACTION,
        tests: [`${V}/interaction/interaction.spec.ts`, 'src/app/pages/lab/lab-interaction.spec.ts'],
      },
      {
        name: 'Dragging, clicks alone and the keyboard',
        what: 'Drag with Escape to put the value back, press a track, or pick up and put down by clicks; arrows, Page keys, Home and End; values in and out, never positions.',
        since: 'M4',
        where: INTERACTION,
        tests: [`${V}/interaction/controller.spec.ts`, `${V}/integration/interactive-figure.spec.ts`, LAB],
      },
      {
        name: 'Controls a figure stands for',
        what: 'Sliders per axis and a radio group per choice, in the figure itself or as native controls beside it holding the same values.',
        since: 'M4',
        where: INTERACTION,
        tests: [`${V}/interaction/controls.spec.ts`, LAB],
      },
    ],
  },
  {
    id: 'S7',
    name: 'Rendering',
    capabilities: [
      {
        name: 'The SVG backend',
        what: 'Draws a resolved frame and plays its timeline, deciding nothing; colours follow light, dark and forced colours without a new frame.',
        covers: ['backend:svg'],
        since: 'v0.1',
        where: SCENES_AT,
        tests: [`${V}/rendering/conformance.spec.ts`],
      },
      {
        name: 'The canvas backend and rendering parity',
        what: 'Draws the same frame and every timeline track on a canvas; the parity suite compares it with SVG pixel by pixel at three pixel ratios.',
        covers: ['backend:canvas'],
        since: 'M6',
        where: PARITY_PAGE,
        tests: [`${V}/rendering/canvas/canvas-backend.spec.ts`, `${V}/rendering/playback.spec.ts`, PARITY],
      },
      {
        name: 'The timing core',
        what: 'Where every track stands at a moment, the same numbers for both backends; shapes between two drawings.',
        since: 'M5',
        where: MOTION_AT,
        tests: [`${V}/rendering/timing.spec.ts`, `${V}/rendering/tween.spec.ts`, LAB],
      },
      {
        name: 'The stimulus lane',
        what: 'Stimuli drawn from their refresh slot and time, events in frames or milliseconds, the check before a run, and a timing log with a verdict per event (browser frame time).',
        since: 'M6',
        where: at('lab-stimulus', 'Stimulus lane'),
        tests: [`${V}/stimulus/stimulus.spec.ts`, LAB],
      },
    ],
  },
  {
    id: 'S8',
    name: 'Assets',
    capabilities: [
      {
        name: 'The asset manifest and source',
        what: 'A record per picture file: checksums, text alternative, origin, licence, review; only approved assets reach a person.',
        since: 'M7',
        where: ASSETS_AT,
        tests: [`${V}/assets/manifest.spec.ts`, LAB],
      },
      {
        name: 'Export',
        what: 'Any scene state or composition as a standalone SVG or a PNG, the same bytes each time, checked against the figure on screen.',
        since: 'M7',
        where: PARITY_PAGE,
        tests: [`${V}/rendering/export/svg-export.spec.ts`, PARITY],
      },
      {
        name: 'The generation path, closed by default',
        what: 'Briefs from fixed lists, checks on what a provider returns, drafts only; no AI provider is configured, and the app can’t reach the path.',
        since: 'M7',
        where: ASSETS_AT,
        tests: [`${V}/assets/generate.spec.ts`, `${V}/dependency-rules.spec.ts`],
      },
    ],
  },
  {
    id: 'S9',
    name: 'Integration',
    capabilities: [
      {
        name: 'The pipeline, the slot and the sources',
        what: 'A scene, a state and its words become a resolved frame any backend can draw; an exercise asks for a visual through the slot and records exactly what it showed.',
        since: 'v0.1',
        where: SCENES_AT,
        tests: [`${V}/integration/pipeline.spec.ts`, `${V}/visual-slot.spec.ts`],
      },
    ],
  },
  {
    id: 'S10',
    name: 'Tooling',
    capabilities: [
      {
        name: 'The Visual Lab and its overlay',
        what: 'Every composition in every state, light and dark, with purposes and replays; a performance overlay for figures that have moved.',
        since: 'v0.1, M6',
        where: at('lab-catalog', 'Catalog of capabilities'),
        tests: [LAB, 'src/app/pages/lab/lab-catalog.spec.ts'],
      },
      {
        name: 'Screenshot baselines',
        what: 'One list of the compositions a review accepted drives one harness: each state drawn on the parity page’s test surface at its approved width, light, dark and forced colours, pixel for pixel. Guards tie every image to an accepted review entry, every entry to its images, and flag images as stale when a composition’s version moves on.',
        since: 'v0.1, M8',
        where: PARITY_PAGE,
        tests: [LAB, 'src/app/pages/lab/lab-baselines.spec.ts'],
      },
    ],
  },
  {
    id: 'S11',
    name: 'Governance',
    capabilities: [
      {
        name: 'Dependency rules',
        what: 'The capabilities stay independent, exercises reach the system only through integration, and the app never reaches the generation path.',
        since: 'v0.1',
        where: at('lab-catalog', 'Catalog of capabilities'),
        tests: [`${V}/dependency-rules.spec.ts`],
      },
      {
        name: 'The authoring guide and its worked example',
        what: '“Giving a new exercise its visuals” (docs/visual-authoring-guide.md): whether a visual is needed, which tier, and each step from spec to review, walked through with reference.guide.days, a real instrument bound here as an exercise binds one.',
        since: 'M8',
        where: at('lab-guide', 'Worked example: reference.guide.days'),
        tests: [`${V}/instruments/guide-days/guide-days.policy.spec.ts`, LAB],
      },
    ],
  },
];
