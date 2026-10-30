import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { Direction, Point, TrackingScore, isDirection, isOnTarget, moveCursor, targetAt } from './tracking';

export interface SetResult {
  on_target_ratio: number;
  measured_ms: number;
}

const SIZE = { width: 480, height: 320 };
const KEYBOARD_SPEED_PX_PER_S = 240;
const KEY_NUDGE_PX = 8;
// Frames longer than this (e.g. a hidden tab) count only up to the cap, so a set
// measures time actually spent playing.
const MAX_FRAME_MS = 100;

/** One timed set of the dot-following game, drawn on a canvas. */
@Component({
  selector: 'app-tracking-game',
  template: `
    <canvas
      #canvas
      tabindex="0"
      role="application"
      aria-roledescription="dot-following game"
      [attr.aria-label]="'Follow the moving dot with your pointer or the arrow keys. ' + remaining() + ' seconds left.'"
      [width]="size.width"
      [height]="size.height"
      (pointermove)="onPointer($event)"
      (keydown)="onKeyDown($event)"
      (keyup)="onKeyUp($event)"
      (blur)="held.clear()"
    ></canvas>
    <p class="timer" aria-live="off">{{ remaining() }} s</p>
  `,
  styles: `
    canvas { display: block; width: 100%; max-width: 480px; aspect-ratio: 3 / 2;
             border: 1px solid var(--border); border-radius: 8px; touch-action: none; cursor: crosshair; }
    .timer { color: var(--muted); margin: 0.25rem 0 0; font-variant-numeric: tabular-nums; }
  `,
})
export class TrackingGame implements AfterViewInit, OnDestroy {
  readonly seconds = input.required<number>();
  readonly speed = input(1);
  readonly ringRadius = input(28);
  readonly finished = output<SetResult>();

  protected readonly size = SIZE;
  protected readonly remaining = signal(0);
  protected readonly held = new Set<Direction>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly score = new TrackingScore();
  private cursor: Point = { x: SIZE.width / 2, y: SIZE.height / 2 };
  private elapsedMs = 0;
  private lastFrame: number | null = null;
  private frameHandle: number | null = null;
  private done = false;

  ngAfterViewInit(): void {
    this.remaining.set(this.seconds());
    this.canvas().nativeElement.focus({ preventScroll: true });
    this.frameHandle = requestAnimationFrame((t) => this.frame(t));
  }

  ngOnDestroy(): void {
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
  }

  protected onPointer(event: PointerEvent): void {
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.cursor = {
      x: ((event.clientX - rect.left) / rect.width) * SIZE.width,
      y: ((event.clientY - rect.top) / rect.height) * SIZE.height,
    };
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (!isDirection(event.key)) return;
    event.preventDefault();
    // A quick tap may start and end between frames, so each new press nudges at once;
    // holding the key then moves smoothly in frame().
    if (!event.repeat) this.cursor = moveCursor(this.cursor, new Set([event.key]), KEY_NUDGE_PX, SIZE);
    this.held.add(event.key);
  }

  protected onKeyUp(event: KeyboardEvent): void {
    if (isDirection(event.key)) this.held.delete(event.key);
  }

  private frame(now: number): void {
    if (this.done) return;
    const dt = this.lastFrame === null ? 0 : Math.min(now - this.lastFrame, MAX_FRAME_MS);
    this.lastFrame = now;
    this.elapsedMs += dt;

    if (this.held.size > 0) {
      this.cursor = moveCursor(this.cursor, this.held, (KEYBOARD_SPEED_PX_PER_S * dt) / 1000, SIZE);
    }
    const target = targetAt(this.elapsedMs / 1000, SIZE, this.speed(), this.ringRadius() + 8);
    const onTarget = isOnTarget(this.cursor, target, this.ringRadius());
    this.score.add(dt, onTarget);
    this.draw(target, onTarget);

    const left = Math.max(0, Math.ceil(this.seconds() - this.elapsedMs / 1000));
    if (left !== this.remaining()) this.remaining.set(left);

    if (this.elapsedMs >= this.seconds() * 1000) {
      this.done = true;
      this.finished.emit({ on_target_ratio: round(this.score.ratio), measured_ms: Math.round(this.score.measuredMs) });
      return;
    }
    this.frameHandle = requestAnimationFrame((t) => this.frame(t));
  }

  private draw(target: Point, onTarget: boolean): void {
    const ctx = this.canvas().nativeElement.getContext('2d');
    if (!ctx) return; // e.g. test environments without canvas support
    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;

    ctx.clearRect(0, 0, SIZE.width, SIZE.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = onTarget ? color('--accent', '#2457c5') : color('--muted', '#777');
    ctx.beginPath();
    ctx.arc(target.x, target.y, this.ringRadius(), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color('--text', '#222');
    ctx.beginPath();
    ctx.arc(target.x, target.y, 7, 0, Math.PI * 2);
    ctx.fill();
    // Keyboard cursor (pointer users see their own cursor too).
    ctx.strokeStyle = color('--text', '#222');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.cursor.x - 6, this.cursor.y);
    ctx.lineTo(this.cursor.x + 6, this.cursor.y);
    ctx.moveTo(this.cursor.x, this.cursor.y - 6);
    ctx.lineTo(this.cursor.x, this.cursor.y + 6);
    ctx.stroke();
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
