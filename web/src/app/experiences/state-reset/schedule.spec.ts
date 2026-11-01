import { STATE_RESET } from '../../../content';
import { buildSchedule, timedSeconds } from './schedule';

const timing = { practice_seconds: 15, hold_seconds: 10, sets: 3, set_seconds: 24, rest_seconds: 10 };

describe('State Reset schedule', () => {
  it('matches the image and game-only variants on timed duration', () => {
    const image = buildSchedule(STATE_RESET.timing, 'image');
    const gameOnly = buildSchedule(STATE_RESET.timing, 'game_only');
    expect(timedSeconds(image)).toBe(timedSeconds(gameOnly));
  });

  it('matches them on game exposure, including the practice round', () => {
    const games = (v: 'image' | 'game_only') =>
      buildSchedule(timing, v).filter((p) => p.kind === 'play' || p.kind === 'practice');
    expect(games('image')).toEqual(games('game_only'));
    expect(games('image').filter((p) => p.kind === 'play')).toHaveLength(3);
  });

  it('asks for the picture first, and image ratings before and after, only in the image variant', () => {
    const kinds = (v: 'image' | 'game_only') => buildSchedule(timing, v).map((p) => p.kind);
    expect(kinds('image')).toEqual([
      'intro', 'picture', 'rating', 'practice', 'hold', 'play', 'rest', 'play', 'rest', 'play', 'rating',
    ]);
    expect(kinds('game_only')).toEqual(['intro', 'practice', 'hold', 'play', 'rest', 'play', 'rest', 'play']);
  });

  it('uses the 8 x 24 s protocol in the current content', () => {
    const image = buildSchedule(STATE_RESET.timing, 'image');
    expect(image.filter((p) => p.kind === 'play')).toHaveLength(8);
    // 15 practice + 10 hold + 8 x 24 play + 7 x 10 rest
    expect(timedSeconds(image)).toBe(287);
  });

  it('adds up the timed phases', () => {
    // 15 practice + 10 hold + 3 x 24 play + 2 x 10 rest
    expect(timedSeconds(buildSchedule(timing, 'image'))).toBe(117);
  });
});
