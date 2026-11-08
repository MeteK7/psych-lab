import { NgComponentOutlet } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';

import { VISUAL_SOURCE, Visual, VisualRequest, resolveWithin } from './visual';

/**
 * The one place a visual appears. Keeps its space while waiting, then shows the result, or nothing
 * if there's none. It never tells the exercise what happened, so a step can't depend on a picture.
 */
@Component({
  selector: 'app-visual-slot',
  imports: [NgComponentOutlet],
  template: `
    @if (visual(); as v) {
      @switch (v.kind) {
        @case ('component') {
          <figure role="img" [attr.aria-label]="v.alt">
            <ng-container *ngComponentOutlet="v.component; inputs: v.inputs" />
          </figure>
        }
        @case ('image') {
          <figure>
            <picture>
              @if (v.srcDark) {
                <source [attr.srcset]="v.srcDark" media="(prefers-color-scheme: dark)" />
              }
              <img [src]="v.src" [alt]="v.alt" [width]="v.width" [height]="v.height" />
            </picture>
          </figure>
        }
      }
    } @else {
      <!-- Waiting: holds the space, so the page doesn't jump when the visual arrives. -->
      <div class="waiting" [style.aspect-ratio]="ratio()"></div>
    }
  `,
  styles: `
    :host { display: block; max-width: 480px; margin: 0 0 1rem; }
    figure { margin: 0; }
    img { display: block; width: 100%; height: auto; }
  `,
})
export class VisualSlot {
  readonly request = input.required<VisualRequest>();
  /** The shape of the space held while waiting. */
  readonly ratio = input('480 / 120');
  /** How long to wait before showing nothing. */
  readonly timeoutMs = input(1500);

  private readonly source = inject(VISUAL_SOURCE, { optional: true });
  /** Null while waiting for the first result; a later request keeps the current visual until it resolves. */
  protected readonly visual = signal<Visual | null>(null);

  constructor() {
    effect((onCleanup) => {
      const request = this.request();
      let current = true;
      onCleanup(() => (current = false));
      void resolveWithin(this.source, request, untracked(this.timeoutMs)).then((visual) => {
        if (current) this.visual.set(visual);
      });
    });
  }
}
