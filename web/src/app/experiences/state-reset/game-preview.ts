import { Component, input } from '@angular/core';

import { STATE_RESET } from '../../../content';

/** A still, labelled picture of the dot-following game, shown before the practice round. */
@Component({
  selector: 'app-game-preview',
  template: `
    <figure>
      <svg viewBox="0 0 480 200" role="img" [attr.aria-label]="content.illustration_alt">
        <rect x="1" y="1" width="478" height="198" rx="8" class="box" />
        <!-- Ring and dot, drawn as in the game (ring shown in its "inside" colour). -->
        <circle cx="150" cy="110" [attr.r]="ringRadius()" class="ring" />
        <circle cx="150" cy="110" r="7" class="dot" />
        <!-- Pointer arrow, inside the ring. -->
        <path d="M160 116 l0 22 l6 -6 l5 11 l4 -2 l-5 -11 l8 0 z" class="pointer" />
        <!-- Labels with leader lines. -->
        <line x1="150" y1="103" x2="150" y2="40" class="leader" />
        <text x="158" y="36" class="label">{{ content.labels.dot }}</text>
        <line [attr.x1]="150 + ringRadius()" y1="104" x2="250" y2="88" class="leader" />
        <text x="256" y="92" class="label">{{ content.labels.ring }}</text>
        <line x1="176" y1="146" x2="250" y2="160" class="leader" />
        <text x="256" y="164" class="label">{{ content.labels.pointer }}</text>
      </svg>
    </figure>
  `,
  styles: `
    figure { margin: 0 0 1rem; max-width: 480px; }
    svg { display: block; width: 100%; height: auto; }
    .box { fill: none; stroke: var(--border); }
    /* The ring as the game draws it with the pointer inside: accent colour and heavier (tracking.ts, RING). */
    .ring { fill: none; stroke: var(--accent); stroke-width: 5; }
    @media (forced-colors: active) { .ring { stroke: Highlight; } .dot { fill: CanvasText; } }
    .dot { fill: var(--text); }
    .pointer { fill: var(--bg); stroke: var(--text); stroke-width: 1.5; }
    .leader { stroke: var(--muted); stroke-width: 1; }
    .label { fill: var(--text); font: 14px system-ui, sans-serif; }
  `,
})
export class GamePreview {
  readonly ringRadius = input(28);
  protected readonly content = STATE_RESET.how_it_works;
}
