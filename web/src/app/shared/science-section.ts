import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { Evidence, SCIENCE_SOURCES, ScienceContent } from '../../content';
import { Icon } from './icon';

const EVIDENCE_LABELS: Record<Evidence, string> = {
  full_text: 'Full text checked',
  abstract: 'Summary checked; full text not yet',
};

/**
 * "Why this exercise?" (plan §3.1): the science behind an exercise, in the page itself.
 * Native <details>, collapsed by default, so it works with keyboard and screen readers and
 * never interrupts a step. After "What you do", an explanation may say why the exercise is
 * worth doing, in everyday terms. Each part has its own heading; each research finding shows its
 * sources and how far they were checked; "About this exercise" is highlighted, because it
 * separates the method's evidence from this untested version.
 */
@Component({
  selector: 'app-science-section',
  imports: [Icon, NgTemplateOutlet],
  template: `
    <details class="science" [open]="open()">
      <summary>
        <span class="tile"><app-icon name="flask" /></span>
        <span class="summary-text">
          <span class="title">Why this exercise?</span>
          @if (method()) {
            <span class="subtitle">The science behind it: {{ method() }}</span>
          }
        </span>
        <app-icon name="chevron-down" class="chevron" />
      </summary>

      <div class="body">
        <section class="part">
          <h3><app-icon name="play" /> What you do</h3>
          @for (para of paragraphs(science().what_you_do); track $index) {
            <p>{{ para }}</p>
          }
        </section>

        @if (science().why; as why) {
          <section class="part">
            <h3><app-icon name="flag" /> Why it's worth doing</h3>
            @for (para of paragraphs(why); track $index) {
              <p>{{ para }}</p>
            }
          </section>
        }

        <section class="part">
          <h3><app-icon name="bulb" /> The method: {{ science().method.name }}</h3>
          @for (para of paragraphs(science().method.text); track $index) {
            <p>{{ para }}</p>
          }
        </section>

        @if (layered()) {
          <!-- Explanations with evidence layers: method research, then similar exercises. -->
          <section class="part">
            <h3><app-icon name="search" /> Research on the method</h3>
            <ng-container *ngTemplateOutlet="findingList; context: { $implicit: layer('method') }" />
          </section>
          <section class="part">
            <h3><app-icon name="search" /> Research on similar exercises</h3>
            <ng-container *ngTemplateOutlet="findingList; context: { $implicit: layer('similar') }" />
            @if (science().similar_note; as note) {
              <p>{{ note }}</p>
            }
          </section>
        } @else {
          <section class="part">
            <h3><app-icon name="search" /> What research says about this method</h3>
            <ng-container *ngTemplateOutlet="findingList; context: { $implicit: findings() }" />
          </section>
        }

        <ng-template #findingList let-list>
          @if (list.length) {
            <ul class="findings">
              @for (finding of list; track finding.text) {
                <li class="finding">
                  <p>{{ finding.text }}</p>
                  @if (finding.who) {
                    <p class="who">{{ finding.who }}</p>
                  }
                  <ul class="refs" aria-label="Sources for this finding">
                    @for (source of finding.sources; track source.citation) {
                      <li>
                        {{ source.citation }}
                        <span class="level" [class.partial]="source.evidence === 'abstract'">{{ source.level }}</span>
                      </li>
                    }
                  </ul>
                </li>
              }
            </ul>
          }
        </ng-template>

        <section class="callout">
          <h3><app-icon name="info" /> About this exercise</h3>
          @for (para of paragraphs(science().about_this_exercise); track $index) {
            <p>{{ para }}</p>
          }
        </section>

        <section class="part">
          <h3><app-icon name="alert" /> Limits</h3>
          <ul class="limits">
            @for (limit of science().limits; track limit) {
              <li>{{ limit }}</li>
            }
          </ul>
        </section>

        <section class="part">
          <h3><app-icon name="book" /> Sources</h3>
          <ol class="sources">
            @for (source of sources(); track source.url) {
              <li>
                {{ source.citation }}.
                <a [href]="source.url" target="_blank" rel="noopener noreferrer">
                  {{ source.title }}<app-icon name="external" class="external" /><span class="sr-only"> (opens in a new tab)</span>
                </a>
                @if (source.evidence === 'abstract') {
                  <span class="muted"> (summary checked; full text not yet)</span>
                }
              </li>
            }
          </ol>
        </section>
      </div>
    </details>
  `,
  styles: `
    .science { margin: 1.25rem 0; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); }
    summary {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem;
      cursor: pointer; list-style: none; border-radius: 12px;
    }
    summary::-webkit-details-marker { display: none; }
    summary:hover { background: color-mix(in srgb, var(--text) 4%, transparent); }
    .science[open] summary { border-bottom: 1px solid var(--border); border-radius: 12px 12px 0 0; }
    .tile {
      display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 8px; font-size: 1.25rem;
      color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent);
    }
    .summary-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .title { font-weight: 600; font-size: 1.05rem; }
    .subtitle { font-size: 0.875rem; color: var(--muted); }
    .chevron { font-size: 1.15rem; color: var(--muted); transition: transform 150ms ease-out; }
    .science[open] .chevron { transform: rotate(180deg); }

    .body { padding: 0.25rem 1rem 1rem; }
    .part { padding: 0.875rem 0; border-bottom: 1px solid var(--border); }
    .part:last-child { border-bottom: 0; padding-bottom: 0; }
    h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.375rem; font-size: 0.95rem; color: var(--text); }
    h3 app-icon { font-size: 1.05rem; color: var(--accent); }
    p { margin: 0; }
    p + p { margin-top: 0.5rem; }

    .findings { display: grid; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
    .finding { padding: 0.625rem 0.75rem; border-radius: 8px; background: color-mix(in srgb, var(--text) 5%, transparent); }
    .who { font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem; }
    .refs { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin: 0.375rem 0 0; padding: 0; list-style: none;
            font-size: 0.85rem; color: var(--muted); }
    .refs li { display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .level { font-size: 0.75rem; padding: 0 0.5rem; border-radius: 999px; border: 1px solid var(--border); }
    .level.partial { border-style: dashed; }

    .callout {
      margin: 0.875rem 0; padding: 0.75rem 0.875rem; border-radius: 8px;
      border: 1px solid var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent);
    }
    .callout h3, .callout h3 app-icon { color: var(--accent); }

    .limits { margin: 0; padding-left: 1.25rem; display: grid; gap: 0.25rem; }
    .sources { margin: 0; padding-left: 1.25rem; display: grid; gap: 0.375rem; font-size: 0.9rem; }
    .sources a { color: var(--accent); }
    .external { margin-left: 0.25rem; vertical-align: -0.1em; font-size: 0.85em; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class ScienceSection {
  readonly science = input.required<ScienceContent>();
  /** The method's short name, shown in the collapsed bar (e.g. "Implementation intentions"). */
  readonly method = input<string>();
  readonly open = input(false);

  protected readonly findings = computed(() =>
    this.science().research.map((r) => ({
      text: r.text,
      who: r.who,
      layer: r.layer,
      sources: r.sources.map((key) => this.describe(key)),
    })),
  );

  /** Cognitive shifts explanations separate research on the method from similar exercises. */
  protected readonly layered = computed(() => this.science().research.some((r) => r.layer));

  protected layer(layer: 'method' | 'similar') {
    return this.findings().filter((f) => f.layer === layer);
  }

  /** Every cited source once, in order of first citation. */
  protected readonly sources = computed(() => {
    const keys = [...new Set(this.science().research.flatMap((r) => r.sources))];
    return keys.map((key) => this.describe(key));
  });

  /** Content may hold several paragraphs, separated by a blank line. */
  protected paragraphs(text: string): string[] {
    return text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  }

  private describe(key: string) {
    const source = SCIENCE_SOURCES.sources[key];
    return { ...source, level: EVIDENCE_LABELS[source.evidence] };
  }
}
