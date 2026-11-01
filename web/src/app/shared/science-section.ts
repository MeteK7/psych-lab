import { Component, computed, input } from '@angular/core';

import { SCIENCE_SOURCES, ScienceContent } from '../../content';

/**
 * "Why this exercise?" (plan §3.1): an expandable explanation of the method, the research
 * on that method, and what is untested about this version. Closed by default; native
 * <details>, so it works with keyboard and screen readers and never interrupts a step.
 */
@Component({
  selector: 'app-science-section',
  template: `
    <details class="science" [open]="open()">
      <summary>Why this exercise?</summary>
      <div class="body">
        <h3>What you do</h3>
        <p>{{ science().what_you_do }}</p>

        <h3>The method: {{ science().method.name }}</h3>
        <p>{{ science().method.text }}</p>

        <h3>What research says about this method</h3>
        @for (finding of findings(); track finding.text) {
          <p>
            {{ finding.text }}
            <span class="cite">({{ finding.citations }})</span>
          </p>
        }

        <h3>About this exercise</h3>
        <p>{{ science().about_this_exercise }}</p>

        <h3>Limits</h3>
        <ul>
          @for (limit of science().limits; track limit) {
            <li>{{ limit }}</li>
          }
        </ul>

        <h3>Sources</h3>
        <ul class="sources">
          @for (source of sources(); track source.url) {
            <li>
              {{ source.citation }}.
              <a [href]="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a>
              @if (source.evidence === 'abstract') {
                <span class="muted"> (summary checked; full text not yet)</span>
              }
            </li>
          }
        </ul>
      </div>
    </details>
  `,
  styles: `
    .science { border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.5rem 1rem; margin: 1rem 0; }
    summary { cursor: pointer; font-weight: 600; }
    .body { max-width: 42rem; }
    h3 { font-size: 1rem; margin: 1rem 0 0.25rem; }
    p { margin: 0 0 0.5rem; }
    .cite { color: var(--muted); }
    .sources { font-size: 0.9rem; }
  `,
})
export class ScienceSection {
  readonly science = input.required<ScienceContent>();
  readonly open = input(false);

  protected readonly findings = computed(() =>
    this.science().research.map((r) => ({
      text: r.text,
      citations: r.sources.map((key) => SCIENCE_SOURCES.sources[key].citation).join('; '),
    })),
  );

  /** Every cited source once, in order of first citation. */
  protected readonly sources = computed(() => {
    const keys = [...new Set(this.science().research.flatMap((r) => r.sources))];
    return keys.map((key) => SCIENCE_SOURCES.sources[key]);
  });
}
