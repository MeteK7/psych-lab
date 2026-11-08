import { Component, inject, signal } from '@angular/core';

import { AppEnvironment } from '../../shared/app-environment';
import { PURPOSE_LABELS, SceneDefinition, elementsOf } from '../../shared/visual/composition/scene';
import { validateScene } from '../../shared/visual/composition/validate';
import { QualityTier, SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { Mover, motionProblems, movers } from '../../shared/visual/motion/plan-motion';
import { SCENES } from '../../shared/visual/scenes';
import { EMPHASIS_CHANGE, MOTION, MOTION_EFFECTS, THEMES } from '../../shared/visual/styling/vocabulary';

/**
 * The Visual Lab (S10, docs/visual-system.md §5.3), development build only. Every composition in
 * every state, light and dark, with the purpose of each element (docs/visual-policy.md §2), and
 * each state change the exercise makes, replayable, with what moves and why. Compositions are
 * reviewed here (R2); in context, they're reviewed in the exercise itself (R3).
 */
@Component({
  selector: 'app-lab-page',
  imports: [SceneFigure],
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
    } @else {
      <p>The Visual Lab is available in the development build only.</p>
    }
  `,
  styles: `
    .lead { font-size: 1.1rem; }
    .notes { padding-left: 1.25rem; font-size: 0.9rem; }
    .scene { margin: 0 0 2rem; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1rem; margin: 1.25rem 0 0.4rem; }
    h4 { font-size: 0.95rem; margin: 0; }
    .note { font-size: 0.9rem; margin: 0 0 0.5rem; }
    .tier { display: inline-flex; gap: 0.5rem; align-items: center; font-size: 0.9rem; margin-bottom: 0.25rem; }
    .transition { display: flex; gap: 1rem; align-items: baseline; margin: 1rem 0 0.4rem; }
    .replay { font-size: 0.85rem; }
    .moves { font-size: 0.9rem; margin: 0.4rem 0 0; }
    .meta { font-weight: 400; color: var(--muted); font-size: 0.95rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .panel { border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.75rem 0.75rem;
             background: var(--bg); color: var(--text); }
    /* The page's own token values (styles.css), pinned per panel so both schemes show side by side. */
    .light { --bg: #ffffff; --text: #1c1c1e; --muted: #55575d; --border: #d6d7db; --accent: #2457c5; }
    .dark { --bg: #17181b; --text: #ececef; --muted: #a9abb2; --border: #3a3c42; --accent: #8fb0ff; }
    .tag { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.25rem; }
    /* Forced colours replace the pinned panel backgrounds, so the tags follow the system colours too. */
    @media (forced-colors: active) { .tag { color: CanvasText; } }
    figure { margin: 0; }
    .alt { margin: 0.4rem 0 0; font-size: 0.9rem; }
    table { font-size: 0.9rem; }
    th[scope='row'] { font-weight: 400; white-space: nowrap; vertical-align: top; }
    td { vertical-align: top; }
    .problems { border-left: 3px solid var(--accent); padding-left: 1.5rem; }
  `,
})
export class LabPage {
  protected readonly env = inject(AppEnvironment);
  protected readonly schemes: SurfaceScheme[] = ['light', 'dark'];
  protected readonly tier = signal<QualityTier | 'auto'>('auto');
  /** Bumped by Replay: a new run re-creates the figures, which then play the change again. */
  protected readonly runs = signal<Record<string, number>>({});

  protected readonly entries = SCENES.map(({ scene, text }) => ({
    scene,
    text,
    headingId: `lab-${scene.id.replace(/\W/g, '-')}`,
    problems: [...validateScene(scene, text), ...motionProblems(scene)],
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
