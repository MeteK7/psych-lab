import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AppEnvironment } from '../../../shared/app-environment';
import { CASES } from './cases';
import { Direction, directions, engineDirections, IDIOMS } from './figures';
import { StudyFigure } from './study-figure';

type SetId = 'one-per-case' | 'all' | 'spatial' | 'kinetic' | 'field' | 'engine';

/** A small seeded generator, so an order can be written down and shown again. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const r = seeded(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The figures a set shows. `one-per-case`: twelve figures, the idiom rotating with the seed.
 * `engine`: the engine's own figures (Stage 3, M3), the accepted unseen cases, which the corpus sets
 * don't include: every corpus figure is drawn by its case's own pattern.
 */
export function figureSet(all: readonly Direction[], set: SetId, seed: number, engine: readonly Direction[] = []): Direction[] {
  if (set === 'engine') return [...engine];
  if (set === 'all') return [...all];
  if (set !== 'one-per-case') return all.filter((d) => d.idiom === set);
  return CASES.map((c, k) => all.find((d) => d.case.id === c.id && d.idiom === IDIOMS[(k + seed) % IDIOMS.length])!);
}

/**
 * STUDY CODE: pass E preparation (docs/visual-study/pass-e-procedure.md). Two modes, in this order:
 * unprompted (one figure at a time, sequences and viewpoint moves playing by themselves, "What do you
 * see happening?"), then matching (the figures shuffled again beside the source texts). Nothing typed
 * or chosen leaves the page: there is no request, no storage, and a reload clears it. The figure's
 * text alternative is kept out of its accessible name here, since it would give the answer away.
 */
@Component({
  selector: 'app-study-match-page',
  imports: [StudyFigure, RouterLink],
  styleUrls: ['../lab.css'],
  styles: `
    .controls { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin: 0.5rem 0 1rem; align-items: end; }
    .modes { display: flex; gap: 0.5rem; margin: 1rem 0; }
    .modes button[aria-pressed='true'] { font-weight: 600; }
    .stage { max-width: 960px; }
    textarea { width: 100%; min-height: 6rem; font: inherit; margin-top: 0.5rem; }
    .nav { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.75rem; }
    .texts { margin: 0.5rem 0 1.5rem; padding-left: 1.5rem; }
    .texts li { margin: 0.25rem 0; }
    .row { display: grid; grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr); gap: 1rem; align-items: start; margin: 1.25rem 0; padding-top: 1rem; border-top: 1px solid var(--border); }
    .row select { width: 100%; }
    .verdict { font-size: 0.9rem; margin-top: 0.4rem; }
    .score { font-size: 1.1rem; margin: 1rem 0; }
    .small { font-size: 0.85rem; }
  `,
  template: `
    <h1>Representation study: pass E (preparation)</h1>
    @if (env.showsDevelopment()) {
      <p class="lead">Study code only (docs/visual-study/pass-e-procedure.md). Read the procedure before showing this to anyone. No one has been recruited and no data is collected.</p>
      <ul class="notes muted">
        <li>Nothing typed or chosen here leaves this page: nothing is sent and nothing is stored. Reloading clears everything.</li>
        <li>Unprompted comes first. Matching unlocks after the last unprompted figure.</li>
        <li><a routerLink="/lab/study">Back to the study page</a></li>
      </ul>
      <div class="controls" role="group" aria-label="Session">
        <label class="tier">Figures
          <select [value]="set()" (change)="restart($any($event.target).value, seed())" data-match-set>
            <option value="one-per-case">One per case (12)</option>
            <option value="all">All (36)</option>
            <option value="spatial">Spatial (12)</option>
            <option value="kinetic">Kinetic (12)</option>
            <option value="field">Field (12)</option>
            <option value="engine">Engine (20)</option>
          </select>
        </label>
        <label class="tier">Order
          <input type="number" min="1" max="9999" [value]="seed()" (change)="restart(set(), $any($event.target).valueAsNumber || 1)" data-match-seed />
        </label>
        <label class="tier">Scheme
          <select [value]="scheme()" (change)="scheme.set($any($event.target).value)">
            <option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
        <label class="tier"><input type="checkbox" [checked]="framing()" (change)="framing.set($any($event.target).checked)" data-match-framing /> Framing words (S1)</label>
        <button type="button" (click)="restart(set(), seed())">Clear everything</button>
      </div>

      <div class="modes" role="group" aria-label="Mode">
        <button type="button" [attr.aria-pressed]="mode() === 'unprompted'" (click)="mode.set('unprompted')">1. Unprompted</button>
        <button type="button" [attr.aria-pressed]="mode() === 'matching'" [disabled]="!reachedEnd()" (click)="mode.set('matching')" data-match-to-matching>2. Matching</button>
      </div>

      @if (mode() === 'unprompted') {
        <section class="stage" aria-labelledby="match-unprompted">
          <h2 id="match-unprompted">Figure {{ index() + 1 }} of {{ figures().length }}</h2>
          @for (d of [current()]; track key(d)) {
            <div class="panel" [class]="scheme()">
              <app-study-figure [figure]="d.finished" [scheme]="scheme()" [autoplay]="true" [label]="'Figure ' + (index() + 1)" [tag]="'match-' + key(d)" />
            </div>
            @if (framing() && d.idiom === 'spatial' && d.case.framing) { <p class="small muted">{{ d.case.framing }}</p> }
            <label for="match-describe">What do you see happening?</label>
            <textarea id="match-describe" [value]="said()[key(d)] ?? ''" (input)="say(key(d), $any($event.target).value)" data-match-describe></textarea>
          }
          <div class="nav">
            <button type="button" (click)="go(-1)" [disabled]="index() === 0">Previous</button>
            <button type="button" (click)="go(1)" [disabled]="index() === figures().length - 1" data-match-next>Next</button>
            <span class="muted">Order {{ seed() }}: {{ orderText() }}</span>
          </div>
        </section>
      } @else {
        <section aria-labelledby="match-matching">
          <h2 id="match-matching">Which text does each figure show?</h2>
          <p class="note muted">The texts, lettered. A text may be shown by more than one figure.</p>
          <ol class="texts" type="A">
            @for (t of texts(); track t.id) { <li>{{ t.text }}</li> }
          </ol>
          @for (d of matching(); track key(d); let k = $index) {
            <div class="row">
              <div class="panel" [class]="scheme()">
                <app-study-figure [figure]="d.finished" [scheme]="scheme()" [label]="'Figure ' + (k + 1)" [tag]="'matching-' + key(d)" />
                @if (framing() && d.idiom === 'spatial' && d.case.framing) { <p class="small muted">{{ d.case.framing }}</p> }
              </div>
              <div>
                <label [for]="'match-pick-' + k">Figure {{ k + 1 }} shows text</label>
                <select [id]="'match-pick-' + k" [value]="picked()[key(d)] ?? ''" (change)="pick(key(d), $any($event.target).value)" data-match-pick>
                  <option value="">Choose…</option>
                  @for (t of texts(); track t.id; let j = $index) { <option [value]="t.id">{{ letter(j) }}</option> }
                </select>
                @if (checked()) {
                  <p class="verdict">{{ !picked()[key(d)] ? 'Not chosen (it shows ' + letter(textIndex(d.case.id)) + ').' : picked()[key(d)] === d.case.id ? 'Matched.' : 'Not matched: it shows ' + letter(textIndex(d.case.id)) + '.' }}</p>
                }
              </div>
            </div>
          }
          <button type="button" (click)="checked.set(true)" data-match-check>Count the matches</button>
          @if (checked()) {
            <p class="score" role="status" data-match-score>{{ score() }} of {{ matching().length }} matched ({{ chosen() }} chosen). Counted here only; nothing is kept.</p>
          }
        </section>
      }
    }
  `,
})
export class StudyMatchPage {
  protected readonly env = inject(AppEnvironment);
  private readonly all = directions();
  private readonly engine = engineDirections();
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly set = signal<SetId>((this.query.get('set') as SetId | null) ?? 'one-per-case');
  protected readonly seed = signal(Number(this.query.get('order')) || 1);
  protected readonly scheme = signal<'light' | 'dark'>(this.query.get('scheme') === 'dark' ? 'dark' : 'light');
  protected readonly mode = signal<'unprompted' | 'matching'>('unprompted');
  protected readonly index = signal(0);
  protected readonly reachedEnd = signal(false);
  /** What was typed and chosen: in memory only, for this page's life. */
  protected readonly said = signal<Record<string, string>>({});
  protected readonly picked = signal<Record<string, string>>({});
  protected readonly checked = signal(false);
  /** S1's framing words under a stand-in spatial figure. `?framing=0` hides them (pass-e-procedure.md §3). */
  protected readonly framing = signal(this.query.get('framing') !== '0');

  protected readonly figures = computed(() => shuffled(figureSet(this.all, this.set(), this.seed(), this.engine), this.seed()));
  protected readonly current = computed(() => this.figures()[this.index()]);
  /** Matching shows the same figures in a second order, so position doesn't carry over. */
  protected readonly matching = computed(() => shuffled(this.figures(), this.seed() + 7919));
  /** The texts of the cases shown, in their own order. */
  protected readonly texts = computed(() => shuffled([...new Map(this.figures().map((d) => [d.case.id, { id: d.case.id, text: d.case.text }])).values()], this.seed() + 104729));
  protected readonly orderText = computed(() => this.figures().map((d) => `${d.case.id}-${d.idiom[0].toUpperCase()}`).join(' '));
  protected readonly score = computed(() => this.matching().filter((d) => this.picked()[this.key(d)] === d.case.id).length);
  protected readonly chosen = computed(() => this.matching().filter((d) => this.picked()[this.key(d)]).length);

  protected key(d: Direction): string {
    return `${d.case.id}-${d.idiom}`;
  }

  protected letter(j: number): string {
    return String.fromCharCode(65 + j);
  }

  protected textIndex(caseId: string): number {
    return this.texts().findIndex((t) => t.id === caseId);
  }

  protected go(step: number): void {
    const next = Math.max(0, Math.min(this.figures().length - 1, this.index() + step));
    this.index.set(next);
    if (next === this.figures().length - 1) this.reachedEnd.set(true);
  }

  protected say(key: string, text: string): void {
    this.said.update((s) => ({ ...s, [key]: text }));
  }

  protected pick(key: string, id: string): void {
    this.picked.update((p) => ({ ...p, [key]: id }));
    this.checked.set(false);
  }

  protected restart(set: SetId, seed: number): void {
    this.set.set(set);
    this.seed.set(seed);
    this.mode.set('unprompted');
    this.index.set(0);
    this.reachedEnd.set(this.figures().length === 1);
    this.said.set({});
    this.picked.set({});
    this.checked.set(false);
  }
}
