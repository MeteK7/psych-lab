import { Component, computed, input, signal } from '@angular/core';

import { PURPOSE_LABELS } from '../../shared/visual/composition/scene';
import { lookupOf } from '../../shared/visual/composition/compose';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { validateScene } from '../../shared/visual/composition/validate';
import { FURTHEST, POSITIONS, VIEW, VIEW_PURPOSES, composeView } from '../../shared/visual/instruments/view/view';
import { InstrumentFigure, composeInstrument, instrumentSourceId } from '../../shared/visual/integration/instruments';
import { InteractiveFigure, Values } from '../../shared/visual/integration/interactive-figure';
import { SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { changeMovers, changeProblems } from '../../shared/visual/motion/plan-motion';
import { THEMES } from '../../shared/visual/styling/vocabulary';
import { VIEW_POSITIONS, VIEW_WORDS } from './lab-instrument-sets';
import { describeMover } from './lab-movers';

/**
 * The Visual Lab's section for "Change the camera angle" (camera-angle.view), bound as the
 * exercise will bind it: its native slider holds the position, the figure beside it takes the
 * pointer and reports the position back, and the recorded source names what was drawn. Below: each
 * position as a still, light and dark, and what moves in every change between two positions.
 */
@Component({
  selector: 'app-lab-view',
  imports: [InstrumentFigure, InteractiveFigure],
  styleUrls: ['./lab.css'],
  styles: `
    .control { display: inline-flex; gap: 0.5rem; align-items: center; margin: 0.25rem 0 0.5rem; }
    .changes td, .changes th { padding-right: 0.75rem; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-view">
      <h2 id="lab-view">
        {{ view.id }}<span class="meta">&#64;{{ view.version }} · theme {{ view.theme }}&#64;{{ themeVersion }} · instrument · "Change the camera angle"</span>
      </h2>
      <p class="note muted">
        The moment a person goes back over, seen from where they choose to look from (docs/camera-angle-design.md). In the
        exercise, the person steps back with the slider, or by moving the figure's own bar; the figure is drawn again from that one
        value. No exercise uses it yet.
      </p>
      <h3>In the exercise: the slider, and the figure beside it</h3>
      <label class="control">{{ words.standpoint }}
        <input type="range" data-view="native" min="0" [max]="furthest" step="1" [value]="position()" [attr.aria-valuetext]="names[position()]"
               (input)="position.set($any($event.target).valueAsNumber)" />
        <output data-view="value">{{ names[position()] }}</output>
      </label>
      <div class="grid">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme">
            <span class="tag">{{ view.id }}&#64;{{ view.version }} · {{ scheme }}</span>
            <app-vis-interactive [composed]="composed()" [values]="values()" (valuesChange)="take($event)" [scheme]="scheme" controlledBy="native"
                                 [attr.data-view]="'figure-' + scheme" />
          </div>
        }
      </div>
      <p class="under"><span class="muted">Recorded as the step's visual source: </span><code data-view="source">{{ source() }}</code></p>

      <h3>Each position</h3>
      @for (p of positions; track p) {
        <h4>{{ p }} · {{ names[p] }}</h4>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ view.id }}&#64;{{ view.version }} · {{ scheme }}</span>
              <figure role="img" [attr.aria-label]="words.alts[p]" [attr.data-instrument]="view.id + '-' + p + '-' + scheme">
                <app-vis-instrument instrument="view" [inputs]="{ position: p, words: words }" [scheme]="scheme" />
              </figure>
            </div>
          }
        </div>
        <p class="alt"><span class="muted">Text alternative:</span> {{ words.alts[p] }}</p>
      }

      @if (problems().length) {
        <ul class="moves" [attr.aria-label]="'Validation problems'">
          @for (p of problems(); track p) { <li>{{ p }}</li> }
        </ul>
      }

      <h3>What moves in each change</h3>
      <p class="note muted">
        Every change a person can make, one step or end to end. The table gives each effect's own timing; in the exercise the
        glides follow the person's input, so they take 150 ms.
      </p>
      <table class="changes">
        <caption>At most three movements in a change (visual-policy §3.12); a reflow counts as one.</caption>
        <thead><tr><th scope="col">Change</th><th scope="col">What moves</th><th scope="col">Within budget</th></tr></thead>
        <tbody>
          @for (c of changes; track c.key) {
            <tr [attr.data-view-change]="c.key">
              <th scope="row">{{ c.from }} → {{ c.to }}</th>
              <td>@for (m of c.moves; track m.id) { <div><code>{{ m.id }}</code> {{ m.what }}</div> }</td>
              <td>{{ c.problems.length ? c.problems.join('; ') : 'Yes' }}</td>
            </tr>
          }
        </tbody>
      </table>

      <h3>Why each element is there</h3>
      <table>
        <caption>Every element serves at least one purpose (visual-policy §2).</caption>
        <thead><tr><th scope="col">Element</th><th scope="col">Serves</th><th scope="col">Why</th></tr></thead>
        <tbody>
          @for (row of purposes; track row.id) {
            <tr><th scope="row"><code>{{ row.id }}</code></th><td>{{ row.serves }}</td><td>{{ row.why }}</td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class LabView {
  readonly schemes = input.required<SurfaceScheme[]>();

  protected readonly view = VIEW;
  protected readonly themeVersion = THEMES[VIEW.theme];
  protected readonly furthest = FURTHEST;
  protected readonly words = VIEW_WORDS;
  protected readonly names = VIEW_POSITIONS;
  protected readonly positions = Array.from({ length: POSITIONS }, (_, p) => p);
  /** The exercise's own value. */
  protected readonly position = signal(0);
  protected readonly composed = computed(() => composeInstrument('view', { position: this.position(), words: VIEW_WORDS }));
  protected readonly values = computed<Values>(() => ({ position: this.position() }));
  protected readonly source = computed(() => instrumentSourceId(this.composed()));
  protected readonly problems = computed(() =>
    this.positions.flatMap((p) => {
      const c = composeView({ position: p, words: VIEW_WORDS });
      return [...validateScene(c.scene, lookupOf(c)), ...spacingWarnings(c.scene, lookupOf(c))].map((x) => `position ${p}: ${x}`);
    }),
  );
  protected readonly changes = this.positions.flatMap((from) =>
    this.positions
      .filter((to) => to !== from)
      .map((to) => {
        const before = composeView({ position: from, words: VIEW_WORDS }).scene;
        const after = composeView({ position: to, words: VIEW_WORDS }).scene;
        return { key: `${from}-${to}`, from, to, moves: changeMovers(before, after).map(describeMover), problems: changeProblems(before, after) };
      }),
  );
  protected readonly purposes = VIEW_PURPOSES.map((p) => ({ id: p.id, serves: p.purpose.serves.map((s) => PURPOSE_LABELS[s]).join('; '), why: p.purpose.why }));

  /** The figure reports values; the exercise keeps its own. */
  protected take(values: Values): void {
    this.position.set(Number(values['position']));
  }
}
