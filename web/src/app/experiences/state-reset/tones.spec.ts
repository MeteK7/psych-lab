import { STATE_RESET_SOUND, ToneSettings } from '../../../content';
import { ToneRound } from './tones';

const SETTINGS: ToneSettings = {
  ...STATE_RESET_SOUND.tones,
  min_gap_ms: 1000,
  max_gap_ms: 1000,
  response_window_ms: 800,
};

/** A random source that returns the given values in turn. */
function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('ToneRound', () => {
  it('plays a tone each gap and picks high tones by the configured share', () => {
    // gap draws are irrelevant (fixed gap); pitch draws: 0.1 → high, 0.9 → low
    const round = new ToneRound(SETTINGS, sequence(0, 0.1, 0, 0.9));
    expect(round.tick(0)).toBeNull();
    expect(round.tick(500)).toBe('high'); // the first tone comes after half a gap
    expect(round.tick(1000)).toBeNull();
    expect(round.tick(1500)).toBe('low');
  });

  it('scores hits, misses, false alarms and correct silences', () => {
    const round = new ToneRound(SETTINGS, sequence(0, 0.1, 0, 0.9, 0, 0.1, 0, 0.9));
    round.tick(500); // high
    round.respond(); // hit
    round.tick(1500); // low
    round.respond(); // false alarm (responded to a low tone)
    round.tick(2500); // high, missed
    round.tick(3500); // low, correctly ignored
    round.respond(); // responded to the low tone
    round.respond(); // a second press for the same tone: false alarm
    const result = round.finish(4000);
    expect(result).toEqual({
      on_target_ratio: 0.25, // only the hit was correct
      measured_ms: 4000,
      tones: 4,
      hits: 1,
      misses: 1,
      false_alarms: 3,
    });
  });

  it('does not credit a response that comes after the response window', () => {
    const round = new ToneRound(SETTINGS, sequence(0, 0.1));
    round.tick(500); // high
    round.tick(1400); // window (800 ms) has passed: the tone is closed as a miss
    round.respond(); // no open tone: false alarm
    expect(round.finish(1400)).toMatchObject({ tones: 1, hits: 0, misses: 1, false_alarms: 1 });
  });

  it('reports zero when no tone played', () => {
    expect(new ToneRound(SETTINGS).finish(100)).toMatchObject({ on_target_ratio: 0, tones: 0 });
  });
});
