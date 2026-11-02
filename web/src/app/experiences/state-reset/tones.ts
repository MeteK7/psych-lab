import { ToneSettings } from '../../../content';

export type Pitch = 'low' | 'high';

/** One timed set of the sound game, in the same shape as a dot-game set. */
export interface ToneSetResult {
  /** Share of tones answered correctly: a response to a high tone, none to a low one. */
  on_target_ratio: number;
  measured_ms: number;
  tones: number;
  hits: number;
  misses: number;
  false_alarms: number;
}

interface OpenTone {
  pitch: Pitch;
  startedMs: number;
  responded: boolean;
}

/**
 * Schedules and scores one set of the sound game, driven by elapsed time.
 * Tones come every min_gap–max_gap ms; a share of them are high. A response counts for the
 * open tone if it comes within the response window; otherwise it is a false alarm.
 */
export class ToneRound {
  private nextAtMs: number;
  private open: OpenTone | null = null;
  private tones = 0;
  private correct = 0;
  private hits = 0;
  private misses = 0;
  private falseAlarms = 0;

  constructor(
    private readonly settings: ToneSettings,
    private readonly random: () => number = Math.random,
  ) {
    this.nextAtMs = this.gap() / 2; // the first tone comes soon after the start
  }

  /** Advances to the elapsed time; returns the pitch of a tone that starts now. */
  tick(elapsedMs: number): Pitch | null {
    if (this.open && elapsedMs - this.open.startedMs > this.settings.response_window_ms) this.close();
    if (elapsedMs < this.nextAtMs) return null;
    this.close();
    const pitch: Pitch = this.random() < this.settings.high_share ? 'high' : 'low';
    this.open = { pitch, startedMs: elapsedMs, responded: false };
    this.nextAtMs = elapsedMs + this.gap();
    return pitch;
  }

  /** The person pressed Space or the "High tone" button. */
  respond(): void {
    if (this.open && !this.open.responded) this.open.responded = true;
    else this.falseAlarms++;
  }

  finish(measuredMs: number): ToneSetResult {
    this.close();
    return {
      on_target_ratio: this.tones ? Math.round((this.correct / this.tones) * 1000) / 1000 : 0,
      measured_ms: Math.round(measuredMs),
      tones: this.tones,
      hits: this.hits,
      misses: this.misses,
      false_alarms: this.falseAlarms,
    };
  }

  private close(): void {
    const tone = this.open;
    if (!tone) return;
    this.open = null;
    this.tones++;
    if (tone.pitch === 'high') {
      if (tone.responded) this.hits++;
      else this.misses++;
    } else if (tone.responded) {
      this.falseAlarms++;
    }
    if ((tone.pitch === 'high') === tone.responded) this.correct++;
  }

  private gap(): number {
    const { min_gap_ms: min, max_gap_ms: max } = this.settings;
    return min + this.random() * (max - min);
  }
}
