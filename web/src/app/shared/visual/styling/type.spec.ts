import { HALO, LINE_HEIGHT, textWidth, wrapText } from './type';
import { resolveHalo } from './resolve';

describe('S1 type in figures (M3 stage C)', () => {
  it('measures a line from the platform face, proportional to the size', () => {
    expect(textWidth('Now', 14)).toBeCloseTo(textWidth('Now', 28) / 2, 6);
    expect(textWidth('', 14)).toBe(0);
    // Wide letters are wider than narrow ones; bold is wider than regular.
    expect(textWidth('mmmm', 14)).toBeGreaterThan(textWidth('iiii', 14) * 3);
    expect(textWidth('Wish', 14, 'bold')).toBeGreaterThan(textWidth('Wish', 14));
  });

  it('measures an accented letter as its base letter, and anything unknown wide', () => {
    expect(textWidth('é', 14)).toBe(textWidth('e', 14));
    expect(textWidth('漢', 14)).toBeGreaterThan(textWidth('e', 14));
  });

  it('wraps at spaces within the width, keeping every word in order', () => {
    const words = 'A label can wrap within a set width, at spaces, with lines a little apart.';
    const lines = wrapText(words, 14, 160);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(words);
    for (const line of lines) expect(textWidth(line, 14)).toBeLessThanOrEqual(160);
    // Each line is full: the next line's first word wouldn't have fitted.
    for (let i = 0; i < lines.length - 1; i++) expect(textWidth(`${lines[i]} ${lines[i + 1].split(' ')[0]}`, 14)).toBeGreaterThan(160);
  });

  it('never breaks a word: one longer than the width keeps a line of its own', () => {
    expect(wrapText('a extraordinarily b', 14, 40)).toEqual(['a', 'extraordinarily', 'b']);
  });

  it('keeps the text one line without a width', () => {
    expect(wrapText('one two three', 14)).toEqual(['one two three']);
  });

  it('sets lines 1.2 apart, and the halo in the ground colour', () => {
    expect(LINE_HEIGHT).toBe(1.2);
    expect(resolveHalo()).toEqual({ colour: 'var(--vis-ground)', width: HALO.width });
  });
});
