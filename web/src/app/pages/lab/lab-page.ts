import { Component, inject, signal } from '@angular/core';

import { CS_WHY_IT_HAPPENED, STATE_RESET } from '../../../content';
import { AppEnvironment } from '../../shared/app-environment';
import { PURPOSE_LABELS, SceneDefinition, elementsOf } from '../../shared/visual/composition/scene';
import { lookupOf } from '../../shared/visual/composition/compose';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { validateScene } from '../../shared/visual/composition/validate';
import { CAUSE_MAP, CAUSE_MAP_PURPOSES, CauseMapInput, composeCauseMap } from '../../shared/visual/instruments/cause-map/cause-map';
import { ROUNDS, ROUNDS_PURPOSES } from '../../shared/visual/instruments/rounds/rounds';
import { TRACKING, TRACKING_PURPOSES, TrackingInput, composeTrackingPreview } from '../../shared/visual/instruments/tracking/tracking';
import { InstrumentFigure } from '../../shared/visual/integration/instruments';
import { QualityTier, SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { Mover, motionProblems, movers } from '../../shared/visual/motion/plan-motion';
import { SCENES } from '../../shared/visual/scenes';
import { EMPHASIS_CHANGE, MOTION, MOTION_EFFECTS, THEMES } from '../../shared/visual/styling/vocabulary';
import { LabGenerators } from './lab-generators';
import { LabMaterials } from './lab-materials';
import { LabSheet } from './lab-sheet';
import { LabTrackingStill } from './lab-tracking-still';

/**
 * The Visual Lab (S10, docs/visual-system.md §5.3), development build only. Every composition in
 * every state, light and dark, with the purpose of each element (docs/visual-policy.md §2), and
 * each state change the exercise makes, replayable, with what moves and why. Compositions are
 * reviewed here (R2); in context, they're reviewed in the exercise itself (R3).
 */
@Component({
  selector: 'app-lab-page',
  imports: [SceneFigure, InstrumentFigure, LabGenerators, LabMaterials, LabSheet, LabTrackingStill],
  template: `
    <h1>Visual Lab</h1>
    @if (env.showsDevelopment()) {
      <p class="lead">Each composition in every state and every change between them, for review on its own. The exercise that uses it shows it in context.</p>
      <ul class="notes muted">
        <li>The states are drawn without motion. Each change between them is replayed under "Transitions", in full or reduced motion.</li>
        <li>For forced colours, turn on a Windows contrast theme: every panel then shows system colours.</li>
      </ul>

      @for (entry of entries; track entry.scene.id) {
        <section class="scene" [attr.aria-labelledby]="entry.headingId">
          <h2 [id]="entry.headingId">
            {{ entry.scene.id }}<span class="meta">&#64;{{ entry.scene.version }} · theme {{ entry.scene.theme }}&#64;{{ themeVersion(entry.scene.theme) }} · {{ entry.scene.frame }}</span>
          </h2>
          @if (entry.problems.length) {
            <ul class="problems" aria-label="Validation problems">
              @for (p of entry.problems; track p) { <li>{{ p }}</li> }
            </ul>
          } @else {
            @for (state of entry.states; track state.name) {
              <h3>{{ state.name }}</h3>
              <div class="grid">
                @for (scheme of schemes; track scheme) {
                  <div class="panel" [class]="scheme">
                    <span class="tag">{{ entry.scene.id }}&#64;{{ entry.scene.version }} · {{ scheme }}</span>
                    <figure role="img" [attr.aria-label]="state.alt" [attr.data-baseline]="entry.scene.id + '-' + state.name + '-' + scheme">
                      <app-vis-scene [scene]="entry.scene" [state]="state.name" [text]="entry.text" [scheme]="scheme" />
                    </figure>
                  </div>
                }
              </div>
              <p class="alt"><span class="muted">Text alternative:</span> {{ state.alt }}</p>
            }

            @if (entry.transitions.length) {
              <h3>Transitions</h3>
              <p class="note muted">
                Each change the exercise makes, as it plays when the step changes.
              </p>
              <label class="tier">Motion
                <select [value]="tier()" (change)="setTier($any($event.target).value)">
                  <option value="auto">As your system setting</option>
                  <option value="full">Full</option>
                  <option value="reduced">Reduced (as with reduced motion: no movement)</option>
                </select>
              </label>
              @for (t of entry.transitions; track t.key) {
                <div class="transition">
                  <h4>{{ t.from }} → {{ t.to }}</h4>
                  <button type="button" class="replay" (click)="replay(t.key)">Replay {{ t.from }} → {{ t.to }}</button>
                </div>
                <div class="grid">
                  @for (scheme of schemes; track scheme) {
                    <div class="panel" [class]="scheme">
                      <span class="tag">{{ entry.scene.id }}&#64;{{ entry.scene.version }} · {{ scheme }}</span>
                      @for (run of [runs()[t.key] ?? 0]; track run) {
                        <figure role="img" [attr.aria-label]="t.alt" [attr.data-transition]="t.key + '-' + scheme">
                          <app-vis-scene [scene]="entry.scene" [from]="t.from" [state]="t.to" [text]="entry.text" [scheme]="scheme" [tier]="tier()" />
                        </figure>
                      }
                    </div>
                  }
                </div>
                <ul class="moves">
                  @for (m of t.moves; track m.id) { <li><code>{{ m.id }}</code> {{ m.what }}@if (m.why) {: {{ m.why }}}</li> }
                </ul>
              }
            }

            @if (entry.scene.changes?.length) {
              <h3>What the composition changes from the picture it replaced</h3>
              <ul>
                @for (c of entry.scene.changes; track c) { <li>{{ c }}</li> }
              </ul>
            }

            @if (entry.spacing.length) {
              <h3>Spacing check</h3>
              <ul class="moves" [attr.aria-label]="'Spacing warnings: ' + entry.scene.id">
                @for (w of entry.spacing; track w) { <li>{{ w }}</li> }
              </ul>
            }

            <h3>Why each element is there</h3>
            <table>
              <caption>Every element serves at least one purpose (visual-policy §2).</caption>
              <thead><tr><th scope="col">Element</th><th scope="col">Serves</th><th scope="col">Why</th></tr></thead>
              <tbody>
                @for (row of entry.purposes; track row.id) {
                  <tr><th scope="row"><code>{{ row.id }}</code></th><td>{{ row.serves }}</td><td>{{ row.why }}</td></tr>
                }
              </tbody>
            </table>
          }
        </section>
      }

      <section class="scene" aria-labelledby="lab-instruments">
        <h2 id="lab-instruments">
          {{ causeMap.id }}<span class="meta">&#64;{{ causeMap.version }} · theme {{ causeMap.theme }}&#64;{{ themeVersion(causeMap.theme) }} · instrument</span>
        </h2>
        <p class="note muted">
          The CS2 cause map, drawn from the exercise's answers (docs/cs2-visual-proposal.md). In the exercise, the sliders set the
          answers and the list under the map gives them in words; here, a few sets of answers show every case.
        </p>
        @for (set of causeSets; track set.key) {
          <h3>{{ set.name }}</h3>
          <div class="grid">
            @for (scheme of schemes; track scheme) {
              <div class="panel" [class]="scheme">
                <span class="tag">{{ causeMap.id }}&#64;{{ causeMap.version }} · {{ scheme }}</span>
                <figure role="img" [attr.aria-label]="chartLabel" [attr.data-instrument]="causeMap.id + '-' + set.key + '-' + scheme">
                  <app-vis-instrument instrument="cause-map" [inputs]="{ causes: set.causes, placing: set.placing, axes: axes }" [scheme]="scheme" />
                </figure>
              </div>
            }
          </div>
        }
        @if (causeSpacing.length) {
          <h3>Spacing check</h3>
          <ul class="moves" [attr.aria-label]="'Spacing warnings: ' + causeMap.id">
            @for (w of causeSpacing; track w) { <li>{{ w }}</li> }
          </ul>
        }
        <h3>Why each element is there</h3>
        <table>
          <caption>Every element serves at least one purpose (visual-policy §2).</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">Serves</th><th scope="col">Why</th></tr></thead>
          <tbody>
            @for (row of causeMapPurposes; track row.id) {
              <tr><th scope="row"><code>{{ row.id }}</code></th><td>{{ row.serves }}</td><td>{{ row.why }}</td></tr>
            }
          </tbody>
        </table>
      </section>
      <section class="scene" aria-labelledby="lab-rounds">
        <h2 id="lab-rounds">
          {{ rounds.id }}<span class="meta">&#64;{{ rounds.version }} · theme {{ rounds.theme }}&#64;{{ themeVersion(rounds.theme) }} · instrument</span>
        </h2>
        <p class="note muted">
          The dot game's rounds, above the game on the hold, round and pause screens. The heading and the cue say the round in
          words; the marks show how much is done and left at a glance.
        </p>
        @for (set of roundSets; track set.current) {
          <h3>{{ set.name }}</h3>
          <div class="grid">
            @for (scheme of schemes; track scheme) {
              <div class="panel" [class]="scheme">
                <span class="tag">{{ rounds.id }}&#64;{{ rounds.version }} · {{ scheme }}</span>
                <figure role="img" [attr.aria-label]="'Round ' + set.current + ' of 8'" [attr.data-instrument]="rounds.id + '-' + set.current + '-' + scheme">
                  <app-vis-instrument instrument="rounds" [inputs]="{ total: 8, current: set.current }" [scheme]="scheme" />
                </figure>
              </div>
            }
          </div>
        }
        <h3>Why each element is there</h3>
        <table>
          <caption>Every element serves at least one purpose (visual-policy §2).</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">Serves</th><th scope="col">Why</th></tr></thead>
          <tbody>
            @for (row of roundsPurposes; track row.id) {
              <tr><th scope="row"><code>{{ row.id }}</code></th><td>{{ row.serves }}</td><td>{{ row.why }}</td></tr>
            }
          </tbody>
        </table>
      </section>

      <section class="scene" aria-labelledby="lab-tracking">
        <h2 id="lab-tracking">
          {{ tracking.id }}<span class="meta">&#64;{{ tracking.version }} · theme {{ tracking.theme }}&#64;{{ themeVersion(tracking.theme) }} · instrument</span>
        </h2>
        <p class="note muted">
          The dot game, drawn every frame by the canvas backend, and its preview, drawn from the same parts by the SVG backend.
          Here, still frames: the pointer outside the ring, inside it, and the preview.
        </p>
        @for (set of trackingSets; track set.key) {
          <h3>{{ set.name }}</h3>
          <div class="grid">
            @for (scheme of schemes; track scheme) {
              <div class="panel" [class]="scheme">
                <span class="tag">{{ tracking.id }}&#64;{{ tracking.version }} · {{ scheme }}</span>
                <figure role="img" [attr.aria-label]="set.alt" [attr.data-instrument]="tracking.id + '-' + set.key + '-' + scheme">
                  @if (set.state; as state) {
                    <app-lab-tracking-still [state]="state" [scheme]="scheme" />
                  } @else {
                    <app-vis-instrument instrument="tracking-preview" [inputs]="{ ringRadius: ringRadius, labels: previewLabels }" [scheme]="scheme" />
                  }
                </figure>
              </div>
            }
          </div>
        }
        @if (previewSpacing.length) {
          <h3>Spacing check: the preview</h3>
          <ul class="moves" [attr.aria-label]="'Spacing warnings: ' + tracking.id">
            @for (w of previewSpacing; track w) { <li>{{ w }}</li> }
          </ul>
        }
        <h3>Why each element is there</h3>
        <table>
          <caption>Every element serves at least one purpose (visual-policy §2).</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">Serves</th><th scope="col">Why</th></tr></thead>
          <tbody>
            @for (row of trackingPurposes; track row.id) {
              <tr><th scope="row"><code>{{ row.id }}</code></th><td>{{ row.serves }}</td><td>{{ row.why }}</td></tr>
            }
          </tbody>
        </table>
      </section>

      <app-lab-generators [schemes]="schemes" />
      <app-lab-materials [schemes]="schemes" />
      <app-lab-sheet [schemes]="schemes" />
    } @else {
      <p>The Visual Lab is available in the development build only.</p>
    }
  `,
  styleUrl: './lab.css',
})
export class LabPage {
  protected readonly env = inject(AppEnvironment);
  protected readonly schemes: SurfaceScheme[] = ['light', 'dark'];
  protected readonly tier = signal<QualityTier | 'auto'>('auto');
  protected readonly causeMap = CAUSE_MAP;
  protected readonly rounds = ROUNDS;
  protected readonly roundSets = [
    { current: 1, name: 'Before the first round, and during it' },
    { current: 4, name: 'Round 4: three done' },
    { current: 8, name: 'The last round' },
  ];
  protected readonly roundsPurposes = ROUNDS_PURPOSES.map(({ id, purpose }) => ({ id, serves: purpose.serves.map((k) => PURPOSE_LABELS[k]).join('; '), why: purpose.why }));
  protected readonly tracking = TRACKING;
  protected readonly ringRadius = STATE_RESET.game.ring_radius;
  protected readonly previewLabels = STATE_RESET.how_it_works.labels;
  private readonly still = (onTarget: boolean): TrackingInput => ({
    size: { width: 480, height: 320 },
    target: { x: 170, y: 140 },
    cursor: onTarget ? { x: 178, y: 148 } : { x: 300, y: 220 },
    ringRadius: STATE_RESET.game.ring_radius,
    onTarget,
  });
  protected readonly trackingSets: { key: string; name: string; alt: string; state: TrackingInput | null }[] = [
    { key: 'outside', name: 'The game: pointer outside the ring', alt: 'The dot game, pointer outside the ring', state: this.still(false) },
    { key: 'inside', name: 'The game: pointer inside the ring', alt: 'The dot game, pointer inside the ring', state: this.still(true) },
    { key: 'preview', name: '"How the game works"', alt: STATE_RESET.how_it_works.illustration_alt, state: null },
  ];
  protected readonly trackingPurposes = TRACKING_PURPOSES.map(({ id, purpose }) => ({ id, serves: purpose.serves.map((k) => PURPOSE_LABELS[k]).join('; '), why: purpose.why }));
  protected readonly chartLabel = CS_WHY_IT_HAPPENED.map.chart_label;
  private readonly axisWords = CS_WHY_IT_HAPPENED.map.axes;
  protected readonly axes: CauseMapInput['axes'] = {
    left: this.axisWords[0].low,
    right: this.axisWords[0].high,
    top: this.axisWords[1].low,
    bottom: this.axisWords[1].high,
  };
  /** Answer sets covering every case the map has to draw. */
  protected readonly causeSets: { key: string; name: string; placing: number; causes: CauseMapInput['causes'] }[] = [
    { key: 'start', name: 'Step 4, the start: every cause in the middle, cause 1 being placed', placing: 1, causes: [{ who: 3, time: 3 }, { who: 3, time: 3 }, { who: 3, time: 3 }] },
    { key: 'placing', name: 'Step 4: cause 2 being placed', placing: 2, causes: [{ who: 1, time: 2 }, { who: 3, time: 3 }, { who: 3, time: 3 }] },
    { key: 'spread', name: 'Step 5: causes spread out', placing: 0, causes: [{ who: 1, time: 2 }, { who: 5, time: 5 }, { who: 2, time: 5 }] },
    { key: 'heavy', name: 'Step 5: a heavy map, every cause in one corner', placing: 0, causes: [{ who: 1, time: 1 }, { who: 1, time: 1 }, { who: 1, time: 1 }] },
    { key: 'six', name: 'Step 5: six causes in one place, at the edge', placing: 0, causes: Array.from({ length: 6 }, () => ({ who: 5, time: 1 })) },
  ];
  /** Labels closer than 8 units to a form they don't name (visual-language.md §9), across every answer set. */
  protected readonly causeSpacing = [
    ...new Set(
      this.causeSets.flatMap((set) => {
        const composed = composeCauseMap({ causes: set.causes, placing: set.placing, axes: this.axes });
        return spacingWarnings(composed.scene, lookupOf(composed)).map((w) => `${set.name}: ${w}`);
      }),
    ),
  ];
  protected readonly previewSpacing = (() => {
    const composed = composeTrackingPreview({ ringRadius: this.ringRadius, labels: this.previewLabels });
    return spacingWarnings(composed.scene, lookupOf(composed));
  })();
  protected readonly causeMapPurposes = CAUSE_MAP_PURPOSES.map(({ id, purpose }) => ({
    id,
    serves: purpose.serves.map((k) => PURPOSE_LABELS[k]).join('; '),
    why: purpose.why,
  }));
  /** Bumped by Replay: a new run re-creates the figures, which then play the change again. */
  protected readonly runs = signal<Record<string, number>>({});

  protected readonly entries = SCENES.map(({ scene, text }) => ({
    scene,
    text,
    headingId: `lab-${scene.id.replace(/\W/g, '-')}`,
    problems: [...validateScene(scene, text), ...motionProblems(scene)],
    spacing: spacingWarnings(scene, text),
    states: Object.keys(scene.states.states).map((name) => ({ name, alt: text(scene.alt[name]) ?? '' })),
    purposes: this.purposes(scene),
    transitions: (scene.transitions ?? []).map(([from, to]) => ({
      key: `${from}-${to}`,
      from,
      to,
      alt: text(scene.alt[to]) ?? '',
      moves: movers(scene, from, to).map((m) => this.describe(m)),
    })),
  }));

  protected setTier(tier: QualityTier | 'auto'): void {
    this.tier.set(tier);
  }

  protected replay(key: string): void {
    this.runs.update((runs) => ({ ...runs, [key]: (runs[key] ?? 0) + 1 }));
  }

  /** What a mover does, in words, with the S1 timing it gets. */
  private describe(m: Mover): { id: string; what: string; why: string } {
    const ms = (d: keyof typeof MOTION.durations) => `${MOTION.durations[d]} ms`;
    const along = m.with.length ? `, with ${m.with.join(', ')}` : '';
    if (m.change.kind === 'emphasis')
      return { id: m.id, what: `eases from ${m.change.from} to ${m.change.to} emphasis (${ms(EMPHASIS_CHANGE.duration)})`, why: '' };
    const verb = { fade: 'fades in', rise: 'rises into place', draw: 'is drawn along its direction' }[m.change.effect];
    return { id: m.id, what: `${verb} (${ms(MOTION_EFFECTS[m.change.effect].duration)})${along}`, why: m.change.why };
  }

  protected themeVersion(theme: string): number {
    return THEMES[theme as keyof typeof THEMES];
  }

  private purposes(scene: SceneDefinition) {
    return elementsOf(scene).map(({ element }) => ({
      id: element.id,
      serves: element.purpose.serves.map((k) => PURPOSE_LABELS[k]).join('; '),
      why: element.purpose.why,
    }));
  }
}
