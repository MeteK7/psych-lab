import { Component, inject } from '@angular/core';

import { AppEnvironment } from '../../shared/app-environment';
import { PURPOSE_LABELS, SceneDefinition, elementsOf } from '../../shared/visual/composition/scene';
import { validateScene } from '../../shared/visual/composition/validate';
import { SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { SCENES } from '../../shared/visual/scenes';
import { THEMES } from '../../shared/visual/styling/vocabulary';
import { LabMciiOriginal } from './lab-original';

/** Scenes that replace a picture participants see now, compared side by side with it. */
const ORIGINALS: Record<string, { sourceId: string; request: (state: string) => { scene: string } }> = {
  'mcii.path': { sourceId: LabMciiOriginal.sourceId, request: (state) => ({ scene: `mcii.${state}` }) },
};

/**
 * The Visual Lab (S10, docs/visual-system.md §5.3), development build only. Every composition in
 * every state, light and dark, next to the picture it would replace, with the purpose of each
 * element (docs/visual-policy.md §2). Compositions are reviewed here before they reach an exercise.
 */
@Component({
  selector: 'app-lab-page',
  imports: [SceneFigure, LabMciiOriginal],
  template: `
    <h1>Visual Lab</h1>
    @if (env.showsDevelopment()) {
      <p class="lead">Each composition in every state, next to the picture it would replace. For review before anything reaches an exercise.</p>
      <ul class="notes muted">
        <li>Exercises keep showing their current pictures until a revision is reviewed and accepted.</li>
        <li>Quality tiers (full, reduced, static) look the same until a composition uses motion.</li>
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
              <div class="grid" [class.compare]="entry.original">
                @for (scheme of schemes; track scheme) {
                  @if (entry.original; as original) {
                    <div class="panel" [class]="scheme">
                      <span class="tag">Original ({{ original.sourceId }}) · {{ scheme }}</span>
                      <app-lab-mcii-original [request]="original.request(state.name)" />
                    </div>
                  }
                  <div class="panel" [class]="scheme">
                    <span class="tag">{{ entry.original ? 'Revised' : 'Composition' }} ({{ entry.scene.id }}&#64;{{ entry.scene.version }}) · {{ scheme }}</span>
                    <figure role="img" [attr.aria-label]="state.alt">
                      <app-vis-scene [scene]="entry.scene" [state]="state.name" [text]="entry.text" [scheme]="scheme" />
                    </figure>
                  </div>
                }
              </div>
              <p class="alt"><span class="muted">Text alternative (both):</span> {{ state.alt }}</p>
            }

            @if (entry.scene.changes?.length) {
              <h3>What the revision changes</h3>
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

  protected readonly entries = SCENES.map(({ scene, text }) => ({
    scene,
    text,
    headingId: `lab-${scene.id.replace(/\W/g, '-')}`,
    original: ORIGINALS[scene.id] ?? null,
    problems: validateScene(scene, text),
    states: Object.keys(scene.states.states).map((name) => ({ name, alt: text(scene.alt[name]) ?? '' })),
    purposes: this.purposes(scene),
  }));

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
