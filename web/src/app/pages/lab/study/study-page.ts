import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AppEnvironment } from '../../../shared/app-environment';
import { lookupOf } from '../../../shared/visual/composition/compose';
import { validateScene } from '../../../shared/visual/composition/validate';
import { InstrumentFigure } from '../../../shared/visual/integration/instruments';
import { SceneFigure } from '../../../shared/visual/integration/scene-figure';
import { SCENES } from '../../../shared/visual/scenes';
import { ROOM_WORDS } from '../lab-instrument-sets';
import { LabOverlay } from '../lab-overlay';
import { CASES } from './cases';
import { Axes, Figure } from './idioms/contract';
import { Direction, directions } from './figures';
import { StudyFigure } from './study-figure';

type Scheme = 'light' | 'dark';

/** The moments or positions a figure is checked at. */
export function samples(f: Figure): number[] {
  if (f.motion.kind === 'timeline') return [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  if (f.motion.kind === 'viewpoint') return Array.from({ length: (f.motion.positions.length - 1) * 4 + 1 }, (_, i) => i / 4);
  return [0];
}

/** Everything the validator finds, at every sample, without repeats. */
export function problemsOf(f: Figure): string[] {
  const out = new Set<string>();
  for (const at of samples(f)) {
    const c = f.compose(at);
    for (const p of validateScene(c.scene, lookupOf(c))) out.add(`at ${at}: ${p}`);
  }
  return [...out];
}

export const AXIS_NAMES: readonly (keyof Axes)[] = ['space', 'time', 'substance', 'mode', 'viewpoint'];

/** How many of the five axes two figures differ on. */
export function axesApart(a: Axes, b: Axes): number {
  return AXIS_NAMES.filter((k) => a[k] !== b[k]).length;
}

/**
 * STUDY CODE: the representation study's page in the Visual Lab (docs/visual-study, first slice).
 * Four depth cases, three directions each, by the rules and finished, light and dark, with each
 * figure's text alternative, coverage report, axis values and hand finishing. Development only.
 */
@Component({
  selector: 'app-study-page',
  imports: [StudyFigure, InstrumentFigure, SceneFigure, LabOverlay],
  styleUrls: ['../lab.css'],
  styles: `
    .controls { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin: 0.5rem 0 1rem; }
    .case { margin: 2.5rem 0 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .text { font-size: 1.1rem; margin: 0.25rem 0 0.5rem; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .pair.one { grid-template-columns: 1fr; max-width: 960px; }
    .small { font-size: 0.85rem; }
    .cat { white-space: nowrap; color: var(--muted); }
    .ok { color: var(--muted); }
    details { margin: 0.4rem 0; font-size: 0.9rem; }
    summary { cursor: pointer; }
    ul.tight { margin: 0.25rem 0; padding-left: 1.25rem; }
    .anchors { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  `,
  template: `
    <h1>Representation study, first slice</h1>
    @if (env.showsDevelopment()) {
      <p class="lead">Study code only (docs/visual-study). Each case's representation, drawn in three directions by the idioms' written rules, then finished by hand, with every hand change listed.</p>
      <ul class="notes muted">
        <li>Nothing here is the engine's: shared/visual/ is untouched, and no exercise uses any of it.</li>
        <li>A sequence plays once when asked; the slider scrubs it. A viewpoint moves with its slider. With reduced motion, sequences show their last frame and moves cut.</li>
        <li>For forced colours, turn on a Windows contrast theme.</li>
      </ul>
      <div class="controls" role="group" aria-label="Show">
        <label class="tier">Schemes
          <select [value]="shown()" (change)="shown.set($any($event.target).value)">
            <option value="both">Light and dark</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
        <label class="tier">Versions
          <select [value]="versions()" (change)="versions.set($any($event.target).value)">
            <option value="both">By the rules and finished</option><option value="rules">By the rules</option><option value="finished">Finished</option>
          </select>
        </label>
        <label class="tier">Backend
          <select [value]="backend()" (change)="backend.set($any($event.target).value)" data-study-backend>
            <option value="canvas">Canvas</option><option value="svg">SVG</option>
          </select>
        </label>
        <label class="tier"><input type="checkbox" [checked]="reduce()" (change)="reduce.set($any($event.target).checked)" /> Reduced motion</label>
      </div>
      <app-lab-overlay />

      <section aria-labelledby="study-anchors">
        <h2 id="study-anchors">Anchors: the standard to meet</h2>
        <p class="note muted">Two accepted compositions, for comparison: camera-angle.room&#64;3 from across the room, and mcii.path&#64;4.</p>
        <div class="anchors">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">camera-angle.room · {{ scheme }}</span>
              <app-vis-instrument instrument="room" [inputs]="{ view: 2, words: roomWords }" [scheme]="scheme" />
            </div>
            <div class="panel" [class]="scheme">
              <span class="tag">mcii.path · contrast · {{ scheme }}</span>
              <app-vis-scene [scene]="mcii.scene" state="contrast" [text]="mciiText" [scheme]="scheme" />
            </div>
          }
        </div>
      </section>

      @for (c of cases; track c.id) {
        <section class="case" [attr.aria-labelledby]="'study-' + c.id">
          <h2 [id]="'study-' + c.id">{{ c.id }} <span class="meta">· {{ c.domain }} · {{ c.source }}</span></h2>
          <p class="text">“{{ c.text }}”</p>
          <details>
            <summary>The account and its representation ({{ c.rep.statements.length }} statements)</summary>
            <table>
              <tbody>
                @for (s of c.rep.statements; track s.id) {
                  <tr><th scope="row"><code>{{ s.id }}</code></th><td class="cat">{{ s.commitment }}</td><td><code>{{ s.say.p }}</code> {{ describe(s.say) }}</td><td class="muted">{{ s.basis }}</td></tr>
                }
              </tbody>
            </table>
            <p class="small muted">Phases: {{ c.rep.time.phases.join(' → ') }}{{ c.rep.time.repeats ? ', repeating' : '' }} · facets: {{ facetNames(c) }}</p>
          </details>
          @if (c.possibilities?.length) {
            <p class="small"><span class="muted">Possibilities, listed beside the figure and never in it:</span></p>
            <ul class="tight small">@for (p of c.possibilities; track p) { <li>{{ p }}</li> }</ul>
          }
          @if (c.framing) { <p class="small"><span class="muted">Framing words shown with the spatial figure:</span> {{ c.framing }}</p> }
          <p class="small muted">Axes apart, by pair: {{ apart(c.id) }}</p>

          @for (d of byCase(c.id); track d.idiom) {
            <h3 [id]="'study-' + c.id + '-' + d.idiom">{{ d.idiom }} <span class="meta">· {{ axesText(d.finished.axes) }}</span></h3>
            @for (scheme of schemes(); track scheme) {
              <div class="pair" [class.one]="versions() !== 'both'">
                @if (versions() !== 'finished') {
                  <div class="panel" [class]="scheme">
                    <span class="tag">{{ c.id }} · {{ d.idiom }} · by the rules · {{ scheme }}</span>
                    <app-study-figure [figure]="d.rules" [scheme]="scheme" [backend]="backend()" [reduce]="reduce()" [tag]="c.id + '-' + d.idiom + '-rules-' + scheme" />
                  </div>
                }
                @if (versions() !== 'rules') {
                  <div class="panel" [class]="scheme">
                    <span class="tag">{{ c.id }} · {{ d.idiom }} · finished · {{ scheme }}</span>
                    <app-study-figure [figure]="d.finished" [scheme]="scheme" [backend]="backend()" [reduce]="reduce()" [tag]="c.id + '-' + d.idiom + '-finished-' + scheme" />
                  </div>
                }
              </div>
            }
            <p class="alt"><span class="muted">Text alternative:</span> {{ d.finished.alt }}</p>
            <details>
              <summary>Coverage ({{ d.finished.coverage.shown.length }} shown, {{ d.finished.coverage.notShown.length }} not)</summary>
              <ul class="tight">
                @for (x of d.finished.coverage.shown; track x.id) { <li><code>{{ x.id }}</code> {{ x.how }}</li> }
                @for (x of d.finished.coverage.notShown; track x.id) { <li><code>{{ x.id }}</code> <em>not shown:</em> {{ x.why }}</li> }
              </ul>
            </details>
            <details [open]="d.adjustments.length > 0">
              <summary>Hand finishing: {{ d.adjustments.length }} {{ d.adjustments.length === 1 ? 'change' : 'changes' }} from the rules</summary>
              @if (d.adjustments.length) {
                <ul class="tight">@for (a of d.adjustments; track a.id) { <li><code>{{ a.id }}</code> ({{ a.kind }}) {{ a.what }}: {{ a.why }}</li> }</ul>
              } @else { <p class="ok">None: the finished figure is the rules' figure.</p> }
            </details>
            @if (problems(d).length) {
              <ul class="problems" aria-label="Validation problems">@for (p of problems(d); track p) { <li>{{ p }}</li> }</ul>
            }
          }
        </section>
      }
    }
  `,
})
export class StudyPage {
  protected readonly env = inject(AppEnvironment);
  protected readonly cases = CASES;
  private readonly all = directions();
  /** `?schemes=light&versions=finished&backend=svg` starts the page that way (the measurement script uses it). */
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;
  protected readonly shown = signal<'both' | Scheme>((this.query.get('schemes') as Scheme | null) ?? 'both');
  protected readonly versions = signal<'both' | 'rules' | 'finished'>((this.query.get('versions') as 'rules' | 'finished' | null) ?? 'both');
  protected readonly backend = signal<'canvas' | 'svg'>(this.query.get('backend') === 'svg' ? 'svg' : 'canvas');
  protected readonly reduce = signal(false);
  protected readonly roomWords = ROOM_WORDS;
  protected readonly mcii = SCENES.find((s) => s.scene.id === 'mcii.path')!;
  protected readonly mciiText = this.mcii.text;
  private readonly checked = new Map<Direction, string[]>();

  protected schemes(): Scheme[] {
    const s = this.shown();
    return s === 'both' ? ['light', 'dark'] : [s];
  }

  protected byCase(id: string): Direction[] {
    return this.all.filter((d) => d.case.id === id);
  }

  protected problems(d: Direction): string[] {
    let p = this.checked.get(d);
    if (!p) {
      p = [...problemsOf(d.rules).map((x) => `by the rules, ${x}`), ...problemsOf(d.finished).map((x) => `finished, ${x}`)];
      this.checked.set(d, p);
    }
    return p;
  }

  protected axesText(a: Axes): string {
    return AXIS_NAMES.map((k) => a[k]).join(' · ');
  }

  protected apart(id: string): string {
    const ds = this.byCase(id);
    const out: string[] = [];
    for (let i = 0; i < ds.length; i++)
      for (let j = i + 1; j < ds.length; j++) out.push(`${ds[i].idiom}–${ds[j].idiom} ${axesApart(ds[i].finished.axes, ds[j].finished.axes)}`);
    return out.join(', ');
  }

  protected facetNames(c: (typeof CASES)[number]): string {
    return Object.keys(c.rep.facets).join(', ');
  }

  protected describe(say: object): string {
    return Object.entries(say)
      .filter(([k]) => k !== 'p')
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
      .join(' · ');
  }
}
