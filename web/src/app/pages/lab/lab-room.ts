import { Component, input, signal } from '@angular/core';

import { lookupOf } from '../../shared/visual/composition/compose';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { validateScene } from '../../shared/visual/composition/validate';
import { ROOM, ROOM_POSITIONS, ROOM_PURPOSES, composeRoom } from '../../shared/visual/instruments/camera-room/room';
import { InstrumentFigure, instrumentSourceId } from '../../shared/visual/integration/instruments';
import { SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { ViewpointFigure } from '../../shared/visual/integration/viewpoint-figure';
import { VIEWPOINT_MOVE } from '../../shared/visual/styling/vocabulary';
import { purposeLabel, themeVersion } from '../../shared/visual/styling/pack';
import { ROOM_POSITION_NAMES, ROOM_WORDS } from './lab-instrument-sets';

/**
 * The Visual Lab's section for "Change the camera angle" (camera-angle.room, a spatial view), bound
 * as the exercise will bind it: its native slider holds the position, the viewpoint figure beside it
 * takes the pointer (a drag across it moves the camera) and reports the position it settles on, and
 * the recorded source names what was drawn. Below: each position as a still, light and dark.
 */
@Component({
  selector: 'app-lab-room',
  imports: [InstrumentFigure, ViewpointFigure],
  styleUrls: ['./lab.css'],
  styles: `
    .control { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: center; margin: 0.25rem 0 0.5rem; }
    .stack { display: grid; gap: 0.75rem; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-room">
      <h2 id="lab-room">
        {{ room.id }}<span class="meta">&#64;{{ room.version }} · theme {{ room.theme }}&#64;{{ themeVersion }} · a spatial view · "Change the camera angle"</span>
      </h2>
      <p class="note muted">
        The room, and a camera that steps back through it along one path: from your own eyes, to behind your shoulder, to the far
        corner, to outside the building with its walls drawn cut low (docs/camera-angle-design.md §3; visual-policy §3.4, §3.12, §7).
        In the exercise the slider holds the position; dragging across the picture moves the camera, and letting go settles on a
        position. One move takes {{ move.perPosition }} ms for a position, {{ move.extra }} ms for each further one, {{ move.max }} ms at
        most; with reduced motion it cuts. Open the performance overlay to see the frame rate while it moves.
      </p>
      <h3>In the exercise: the slider, and the picture beside it</h3>
      <div class="control">
        <label>Where you look from
          <input type="range" data-room="native" min="0" [max]="last" step="1" [value]="position()" [attr.aria-valuetext]="names[position()]"
                 (input)="position.set($any($event.target).valueAsNumber)" />
        </label>
        <output data-room="value">{{ names[position()] }}</output>
      </div>
      <div class="stack">
        @for (scheme of schemes(); track scheme) {
          <div class="panel" [class]="scheme">
            <span class="tag">{{ room.id }}&#64;{{ room.version }} · {{ scheme }}</span>
            <app-vis-viewpoint instrument="room" [inputs]="inputs" [position]="position()" (positionChange)="position.set($event)" [scheme]="scheme"
                               [attr.data-room]="'figure-' + scheme" />
          </div>
        }
      </div>
      <p class="under"><span class="muted">Recorded as the step's visual source: </span><code data-room="source">{{ source }}</code></p>

      <h3>Each position</h3>
      @for (p of positions; track p) {
        <h4>{{ p }} · {{ names[p] }}</h4>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ room.id }}&#64;{{ room.version }} · {{ scheme }}</span>
              <figure role="img" [attr.aria-label]="words.alts[p]" [attr.data-instrument]="room.id + '-' + p + '-' + scheme">
                <app-vis-instrument instrument="room" [inputs]="{ view: p, words: words }" [scheme]="scheme" />
              </figure>
            </div>
          }
        </div>
        <p class="alt"><span class="muted">Text alternative:</span> {{ words.alts[p] }}</p>
      }

      @if (problems.length) {
        <ul class="moves" [attr.aria-label]="'Validation problems'">
          @for (p of problems; track p) { <li>{{ p }}</li> }
        </ul>
      }

      <h3>Why each group of elements is there</h3>
      <table>
        <caption>A spatial view names its elements in groups, each with one purpose (visual-policy §2, §3.13).</caption>
        <thead><tr><th scope="col">Group</th><th scope="col">Serves</th><th scope="col">Why</th></tr></thead>
        <tbody>
          @for (row of purposes; track row.id) {
            <tr><th scope="row"><code>{{ row.id }}</code></th><td>{{ row.serves }}</td><td>{{ row.why }}</td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class LabRoom {
  readonly schemes = input.required<SurfaceScheme[]>();

  protected readonly room = ROOM;
  protected readonly themeVersion = themeVersion(ROOM.theme);
  protected readonly move = VIEWPOINT_MOVE;
  protected readonly last = ROOM_POSITIONS - 1;
  protected readonly words = ROOM_WORDS;
  protected readonly inputs = { words: ROOM_WORDS };
  protected readonly names = ROOM_POSITION_NAMES;
  protected readonly positions = Array.from({ length: ROOM_POSITIONS }, (_, p) => p);
  /** The exercise's own value. */
  protected readonly position = signal(0);
  protected readonly source = instrumentSourceId(composeRoom({ view: 0, words: ROOM_WORDS }));
  /** Checked along the whole path, not only at the positions. */
  protected readonly problems = Array.from({ length: (ROOM_POSITIONS - 1) * 4 + 1 }, (_, i) => i / 4).flatMap((view) => {
    const c = composeRoom({ view, words: ROOM_WORDS });
    return [...validateScene(c.scene, lookupOf(c)), ...spacingWarnings(c.scene, lookupOf(c))].map((x) => `view ${view}: ${x}`);
  });
  protected readonly purposes = Object.entries(ROOM_PURPOSES).map(([id, p]) => ({ id, serves: p.serves.map((s) => purposeLabel(s)).join('; '), why: p.why }));
}
