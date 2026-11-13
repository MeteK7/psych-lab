import { Component, computed, input, signal } from '@angular/core';

import { PURPOSE_LABELS } from '../../shared/visual/composition/scene';
import { lookupOf } from '../../shared/visual/composition/compose';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { validateScene } from '../../shared/visual/composition/validate';
import { GUIDE_DAYS, GUIDE_DAYS_PURPOSES, WEEK } from '../../shared/visual/instruments/guide-days/guide-days';
import { InstrumentSlot } from '../../shared/visual/integration/instrument-slot';
import { composeInstrument, instrumentSourceId } from '../../shared/visual/integration/instruments';
import { InteractiveFigure, Values } from '../../shared/visual/integration/interactive-figure';
import { SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { THEMES } from '../../shared/visual/styling/vocabulary';

/** The words an exercise would take from its versioned content. */
const WORDS = { bar: 'Days you plan to practise', days: (n: number) => `${n} of ${WEEK} days` };

/**
 * The Visual Lab's worked example (milestone M8, `docs/visual-authoring-guide.md`): the guide's
 * instrument, `reference.guide.days`, bound here exactly as an exercise binds one, using only what
 * an exercise may use (S9: the instrument registry, the interactive figure, the slot). The
 * exercise's own native control holds the value; the figure takes the pointer and reports values;
 * the text alternative and the recorded source come from the same composition.
 */
@Component({
  selector: 'app-lab-guide',
  imports: [InstrumentSlot, InteractiveFigure],
  styleUrls: ['./lab.css'],
  styles: `
    .control { display: inline-flex; gap: 0.5rem; align-items: center; margin: 0.25rem 0 0.5rem; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-guide">
      <h2 id="lab-guide">
        {{ guide.id }}<span class="meta">&#64;{{ guide.version }} · theme {{ guide.theme }}&#64;{{ themeVersion }} · the authoring guide's worked example</span>
      </h2>
      <p class="note muted">
        How many days of a week a person plans to practise, built step by step in <code>docs/visual-authoring-guide.md</code>. It
        is bound here as an exercise binds an instrument: the exercise's own control holds the number, the figure takes the pointer
        and reports the number back, and the words below the figure say the same. No exercise uses it.
      </p>
      <h3>In an exercise: a native control, and the figure beside it</h3>
      <label class="control">{{ words.bar }}
        <input type="range" data-guide="native" min="0" [max]="week" step="1" [value]="days()" [attr.aria-valuetext]="words.days(days())"
               (input)="days.set($any($event.target).valueAsNumber)" />
        <output data-guide="value">{{ words.days(days()) }}</output>
      </label>
      <div class="grid">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme">
            <span class="tag">{{ guide.id }}&#64;{{ guide.version }} · {{ scheme }}</span>
            <app-vis-interactive [composed]="composed()" [values]="values()" (valuesChange)="take($event)" [scheme]="scheme" controlledBy="native"
                                 [attr.data-guide]="'figure-' + scheme" />
          </div>
        }
      </div>
      <p class="under"><span class="muted">Recorded as the step's visual source: </span><code data-guide="source">{{ source() }}</code></p>
      <h3>Shown only, through the slot</h3>
      <p class="note muted">
        Where the figure only shows the number, the exercise puts the slot in its template; it loads the instrument on demand. Like
        any figure in an exercise, it follows the page's light or dark scheme, so it is shown once.
      </p>
      <div class="grid">
        <div class="panel">
          <span class="tag">{{ guide.id }}&#64;{{ guide.version }} · slot · the page's scheme</span>
          <figure role="img" [attr.aria-label]="words.days(days()) + ' planned'" data-guide="slot">
            <app-vis-instrument-slot instrument="guide-days" [inputs]="inputs()" />
          </figure>
        </div>
      </div>
      @if (problems().length) {
        <ul class="moves" [attr.aria-label]="'Validation problems'">
          @for (p of problems(); track p) { <li>{{ p }}</li> }
        </ul>
      }
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
export class LabGuide {
  readonly schemes = input.required<SurfaceScheme[]>();

  protected readonly guide = GUIDE_DAYS;
  protected readonly themeVersion = THEMES[GUIDE_DAYS.theme];
  protected readonly week = WEEK;
  protected readonly words = WORDS;
  /** The exercise's own value. */
  protected readonly days = signal(3);
  protected readonly inputs = computed(() => ({ days: this.days(), barLabel: WORDS.bar }));
  protected readonly composed = computed(() => composeInstrument('guide-days', this.inputs()));
  protected readonly values = computed<Values>(() => ({ days: this.days() }));
  protected readonly source = computed(() => instrumentSourceId(this.composed()));
  protected readonly problems = computed(() => {
    const c = this.composed();
    return [...validateScene(c.scene, lookupOf(c)), ...spacingWarnings(c.scene, lookupOf(c))];
  });
  protected readonly purposes = GUIDE_DAYS_PURPOSES.map((p) => ({ id: p.id, serves: p.purpose.serves.map((s) => PURPOSE_LABELS[s]).join('; '), why: p.purpose.why }));

  /** The figure reports values; the exercise keeps its own. */
  protected take(values: Values): void {
    this.days.set(Number(values['days']));
  }
}
