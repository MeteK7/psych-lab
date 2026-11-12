import { Component, ElementRef, computed, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';

import { Composed, SHOWN, lookupOf } from '../composition/compose';
import type { Box } from '../composition/bounds';
import type { Pt } from '../composition/outline';
import type { ElementId, ScaleValue, SceneDefinition } from '../composition/scene';
import type { QualityTier } from '../motion/plan-motion';
import { InteractionState, Values, escape, keyChoice, keyStep, lost, move, moving, press, putDown, release } from '../interaction/controller';
import { ChoiceControl, SliderControl, controlsOf } from '../interaction/controls';
import { Hit, hitTest, targetsOf, toScenePoint } from '../interaction/regions';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';
import { INPUT_CHANGE, frameSize } from '../styling/vocabulary';
import { LiveInput, buildChangeTimeline, buildFrame } from './pipeline';
import { reducedMotion } from './reduced-motion';

export type { Values };

/**
 * Who takes the keyboard for an interactive figure (docs/visual-system.md §12):
 * - `figure`: the figure is itself the control. Each axis of each handle is a focus stop, a slider
 *   for assistive technology, stepped by arrows, Page Up and Down, Home and End; the regions that
 *   set one value are a radio group (one stop; arrows move and choose). Focus shows the focus ring.
 * - `native`: native controls next to the figure hold the same values and take the keyboard and
 *   assistive technology (`controlsOf` describes them); the figure takes the pointer only and is a
 *   picture to everything else.
 */
export type ControlledBy = 'figure' | 'native';

/**
 * S9 Integration: a composition a person can move (milestone M4). It takes the exercise's values
 * and reports changes as values, never positions: the exercise draws the figure again from them
 * (`composed`), so a handle always sits where its value is and snaps as it moves. Pointer input:
 * drag a handle, press its track, or click a handle and then where it should go (no drag needed);
 * Escape during a drag or a pick-up puts the value back; a press on a region chooses it. The
 * handle being moved is focal. Hovering shows only a cursor.
 *
 * Motion (M5): each change that follows a person's input (a key, a click, Escape, a snapped step
 * while dragging, a native control beside it) glides quickly (`INPUT_CHANGE`, 150 ms) for the
 * elements that `moves`, focus ring included; nothing else moves. A new step mid-glide carries on
 * from where the handle is. Reduced motion: every change shows at once.
 */
@Component({
  selector: 'app-vis-interactive',
  imports: [SvgBackend],
  host: {
    '[attr.role]': "controlledBy() === 'figure' ? 'group' : 'img'",
    '[attr.aria-label]': 'alt()',
    '[style.cursor]': 'cursor()',
    '(pointerdown)': 'onPress($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)': 'onRelease()',
    '(pointercancel)': 'onLost()',
    '(lostpointercapture)': 'onLost()',
    '(pointerleave)': 'hover.set(null)',
    '(document:keydown)': 'onDocumentKey($event)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  template: `
    <app-vis-svg [frame]="frame()" [timeline]="timeline()" [scheme]="scheme()" />
    @if (controlledBy() === 'figure') {
      @for (c of controls(); track c.key) {
        @if (c.kind === 'slider') {
          <span class="stop" role="slider" tabindex="0" [attr.data-stop]="c.key" [attr.aria-label]="c.label"
                [attr.aria-valuenow]="c.now" [attr.aria-valuemin]="c.min" [attr.aria-valuemax]="c.max"
                [attr.aria-valuetext]="c.text" [attr.aria-orientation]="c.orientation"
                [style.left.%]="place(c.area).left" [style.top.%]="place(c.area).top" [style.width.%]="place(c.area).width" [style.height.%]="place(c.area).height"
                (keydown)="onSliderKey(c, $event)" (focus)="onFocus(c.handle, $event)" (blur)="focused.set(null)"></span>
        } @else {
          <div role="radiogroup" [attr.aria-label]="c.label">
            @for (o of c.options; track o.id) {
              <span class="stop" role="radio" [attr.tabindex]="tabbable(c) === o.id ? 0 : -1" [attr.data-stop]="o.id" [attr.aria-label]="o.label"
                    [attr.aria-checked]="o.checked"
                    [style.left.%]="place(o.area).left" [style.top.%]="place(o.area).top" [style.width.%]="place(o.area).width" [style.height.%]="place(o.area).height"
                    (keydown)="onChoiceKey(c, o.option, $event)" (focus)="onFocus(o.id, $event)" (blur)="focused.set(null)"></span>
            }
          </div>
        }
      }
    }
  `,
  styles: `
    :host { display: block; position: relative; user-select: none; -webkit-user-select: none; }
    /* The focus ring is drawn in the figure, around the target (S1 focus token). */
    .stop { position: absolute; outline: none; }
  `,
})
export class InteractiveFigure {
  /** The figure, drawn by the exercise from `values`. */
  readonly composed = input.required<Composed>();
  readonly values = input.required<Values>();
  readonly controlledBy = input<ControlledBy>('figure');
  readonly scheme = input<SurfaceScheme>('auto');
  /** Defaults to the person's setting: reduced motion shows every change at once. */
  readonly tier = input<QualityTier | 'auto'>('auto');
  /** Every change, in the exercise's own values: while dragging (snapped), on a click, a key, or Escape. */
  readonly valuesChange = output<Values>();

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly state = linkedSignal<Values, InteractionState>({
    source: this.values,
    computation: (values, previous) => ({ values, gesture: previous?.value.gesture ?? null }),
  });
  private pressed = false;
  protected readonly hover = signal<Hit['kind'] | null>(null);
  /** The target with keyboard focus, and whether focus is shown (keyboard focus, not a click). */
  protected readonly focused = signal<{ id: ElementId; visible: boolean } | null>(null);

  private readonly lookup = computed(() => lookupOf(this.composed()));
  private readonly targets = computed(() => targetsOf(this.composed().scene, SHOWN));
  protected readonly alt = computed(() => this.composed().text['alt']);
  protected readonly controls = computed(() => controlsOf(this.composed().scene, this.targets(), this.state().values, this.lookup()));

  private readonly live = computed<LiveInput>(() => {
    const handle = moving(this.state());
    const focus = this.focused();
    return { emphasis: handle ? { [handle]: 'focal' } : {}, focus: focus?.visible ? focus.id : null };
  });
  protected readonly frame = computed(() => buildFrame(this.composed().scene, SHOWN, this.lookup(), this.live()));

  private readonly reduce = reducedMotion();
  /** The figure before and after each change of values (a new scene drawn by the exercise). */
  private readonly change = linkedSignal<SceneDefinition, { before: SceneDefinition | null; now: SceneDefinition }>({
    source: computed(() => this.composed().scene),
    computation: (now, previous) => ({ before: previous ? previous.source : null, now }),
  });
  protected readonly timeline = computed(() => {
    const { before, now } = this.change();
    const tier = this.tier();
    const effective: QualityTier = tier !== 'auto' ? tier : this.reduce() ? 'reduced' : 'full';
    // Words and focus as they are; a change of focus alone moves nothing.
    return untracked(() => buildChangeTimeline(before, now, SHOWN, this.lookup(), effective, { pace: INPUT_CHANGE, live: this.live() }));
  });

  protected readonly cursor = computed(() => {
    const g = this.state().gesture;
    if (g?.kind === 'drag') return 'grabbing';
    if (g?.kind === 'picked') return 'crosshair';
    const over = this.hover();
    return over === 'handle' ? 'grab' : over === 'track' || over === 'region' ? 'pointer' : null;
  });

  /** A focus stop over a target's least area, in percent of the figure, so a screen magnifier follows focus. */
  protected place(area: Box): { left: number; top: number; width: number; height: number } {
    const { width, height } = frameSize(this.composed().scene.frame);
    return { left: (area.x / width) * 100, top: (area.y / height) * 100, width: (area.width / width) * 100, height: (area.height / height) * 100 };
  }

  /** A radio group has one stop: the chosen option, or the first while none is chosen. */
  protected tabbable(c: ChoiceControl): ElementId {
    return (c.options.find((o) => o.checked) ?? c.options[0]).id;
  }

  private point(event: PointerEvent): Pt | null {
    const svg = this.host.querySelector('svg');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return toScenePoint({ x: event.clientX, y: event.clientY }, rect, frameSize(this.composed().scene.frame));
  }

  /** Applies a new interaction state and reports the values when they changed. */
  private apply(next: InteractionState): void {
    const before = this.state().values;
    this.state.set(next);
    if (next.values !== before) this.valuesChange.emit(next.values);
  }

  private stop(id: string): HTMLElement | undefined {
    return [...this.host.querySelectorAll<HTMLElement>('[data-stop]')].find((s) => s.dataset['stop'] === id);
  }

  protected onPress(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary) return;
    const p = this.point(event);
    if (!p) return;
    const hit = this.state().gesture ? null : hitTest(this.targets(), p);
    const { state, capture } = press(this.composed().scene, this.targets(), this.state(), p);
    if (state === this.state()) return;
    event.preventDefault();
    this.apply(state);
    if (capture) {
      this.pressed = true;
      this.host.setPointerCapture?.(event.pointerId);
    }
    if (this.controlledBy() !== 'figure') return;
    // A figure that is the control takes focus where it was pressed, as a native control does.
    const g = state.gesture;
    const target = g && g.kind !== 'cancelled' ? (this.stop(`${g.handle}-x`) ?? this.stop(`${g.handle}-y`)) : hit?.kind === 'region' ? this.stop(hit.id) : undefined;
    target?.focus({ preventScroll: true });
  }

  protected onMove(event: PointerEvent): void {
    const p = this.point(event);
    if (!p) return;
    if (this.pressed) this.apply(move(this.composed().scene, this.state(), p));
    else this.hover.set(hitTest(this.targets(), p)?.kind ?? null);
  }

  protected onRelease(): void {
    if (!this.pressed) return;
    this.pressed = false;
    this.apply(release(this.state()));
  }

  protected onLost(): void {
    this.pressed = false;
    this.apply(lost(this.state()));
  }

  protected onDocumentKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    const { state, handled } = escape(this.state(), this.pressed);
    if (!handled) return;
    event.preventDefault();
    event.stopPropagation();
    this.apply(state);
  }

  /** A click anywhere else puts a picked-up handle down where it was. */
  protected onOutside(event: PointerEvent): void {
    if (event.target instanceof Node && this.host.contains(event.target)) return;
    this.apply(putDown(this.state()));
  }

  protected onFocus(id: ElementId, event: FocusEvent): void {
    const el = event.target as HTMLElement;
    this.focused.set({ id, visible: el.matches?.(':focus-visible') ?? true });
  }

  protected onSliderKey(c: SliderControl, event: KeyboardEvent): void {
    const next = keyStep(this.composed().scene, c.target, c.axis, this.state().values, event.key);
    if (!next) return;
    event.preventDefault();
    this.focused.set({ id: c.handle, visible: true });
    this.apply({ values: next, gesture: null });
  }

  protected onChoiceKey(c: ChoiceControl, focused: ScaleValue, event: KeyboardEvent): void {
    const options = c.options.map((o) => o.option);
    const next = keyChoice(c.value, options, focused, this.state().values, event.key);
    if (!next) return;
    event.preventDefault();
    const id = c.options.find((o) => o.option === next.option)!.id;
    this.apply({ values: next.values, gesture: null });
    // Focus moves with the choice (the radio pattern); it was moved by a key, so it shows.
    this.stop(id)?.focus({ preventScroll: true });
    this.focused.set({ id, visible: true });
  }
}
