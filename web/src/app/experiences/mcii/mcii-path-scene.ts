import { Component, input } from '@angular/core';

import { MCII } from '../../../content';

/**
 * The built-in path picture. It illustrates the process and isn't part of the method: no research
 * tested it. The wall stays low, and the bridge stays dashed because a plan isn't an achievement
 * (docs/mcii-design.md §5). The text alternative is set by the slot.
 */
@Component({
  selector: 'app-mcii-path-scene',
  template: `
    <svg viewBox="0 44 480 116" aria-hidden="true" [class.faded]="faded()">
      <line x1="40" y1="120" x2="419" y2="120" class="path" />
      <circle cx="40" cy="120" r="5" class="now" />
      <text x="40" y="150" text-anchor="middle" class="label">{{ labels.now }}</text>
      <circle cx="430" cy="120" r="11" class="marker" />
      <circle cx="430" cy="120" r="4" class="marker-dot" />
      <text x="430" y="150" text-anchor="middle" class="label">{{ labels.wish }}</text>
      @if (wall()) {
        <rect x="216" y="96" width="48" height="32" rx="2" class="wall" />
        <!-- Courses of bricks, so it reads as a low wall. -->
        <path d="M216 107 H264 M216 118 H264 M232 96 V107 M250 96 V107 M224 107 V118 M241 107 V118 M256 107 V118 M232 118 V128 M250 118 V128" class="bricks" />
        <text x="240" y="150" text-anchor="middle" class="label">{{ labels.obstacle }}</text>
      }
      @if (bridge()) {
        <path d="M170 120 Q240 30 310 120" class="bridge" />
        <text x="240" y="62" text-anchor="middle" class="label">{{ labels.plan }}</text>
      }
    </svg>
  `,
  styles: `
    svg { display: block; width: 100%; height: auto; }
    .faded { opacity: 0.45; }
    .path { stroke: var(--muted); stroke-width: 3; }
    .now { fill: var(--muted); }
    .marker { fill: var(--bg); stroke: var(--accent); stroke-width: 3; }
    .marker-dot { fill: var(--accent); }
    .wall { fill: var(--bg); stroke: var(--accent); stroke-width: 3; }
    .bricks { fill: none; stroke: var(--accent); stroke-width: 1.5; }
    .bridge { fill: none; stroke: var(--text); stroke-width: 2.5; stroke-dasharray: 7 7; }
    .label { fill: var(--text); font: 14px system-ui, sans-serif; }
  `,
})
export class MciiPathScene {
  readonly wall = input(false);
  readonly bridge = input(false);
  readonly faded = input(false);

  protected readonly labels = MCII.scene_labels;
}
