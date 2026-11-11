/**
 * S1 Styling: typography in figures (visual-language.md §9, milestone M3 stage C). Labels wrap
 * here, before any backend draws them, so every backend and the validator see the same lines, and
 * a frame is the same in a browser, a test and an export.
 *
 * Widths are the platform face's advance widths (Segoe UI, the system UI face on Windows, measured
 * in Edge at 1000 px), for printable ASCII in thousandths of an em, at weight 400 and 700. They
 * carry a margin for wider system faces (San Francisco on macOS), so a measured line is never
 * shorter than the drawn one: a line may break a little early, never run past its width.
 */
export const LINE_HEIGHT = 1.2;

/** At least this far, in scene units, from any form a label doesn't name (§9). */
export const LABEL_CLEARANCE = 8;

/** A label's halo: a stroke of the ground colour behind its glyphs, this wide (so half of it shows around them). */
export const HALO = { width: 4 } as const;

/** How far a line of type reaches above and below its baseline, in ems (the face's caps and descenders). */
export const TYPE_EXTENT = { ascent: 0.72, descent: 0.22 } as const;

const MARGIN = 1.08;

// Advance widths for characters 32 (space) to 126 (~).
const REGULAR =
  '274,284,392,591,539,818,800,230,302,302,417,684,217,400,217,390,539,539,539,539,539,539,539,539,539,539,217,217,684,684,684,448,955,645,573,619,701,506,488,686,710,266,357,580,471,898,748,754,560,754,598,531,524,687,621,934,590,553,570,302,379,302,684,415,268,509,588,462,589,523,313,589,566,242,242,497,242,861,566,586,588,589,348,424,339,566,479,723,459,484,452,302,239,302,684';
const BOLD =
  '276,327,493,592,575,867,850,293,369,369,455,707,271,404,271,443,575,575,575,575,575,575,575,575,575,575,271,271,707,707,707,438,954,703,641,624,737,532,520,711,766,317,445,649,511,957,790,758,614,758,653,561,586,723,667,1005,655,607,607,369,436,369,707,415,314,538,620,480,619,541,383,619,602,284,284,559,284,916,605,611,620,619,398,440,389,605,542,797,552,538,479,369,326,369,707';
const table = (s: string) => s.split(',').map(Number);
const WIDTHS = { regular: table(REGULAR), bold: table(BOLD) };
/** Typographic punctuation outside ASCII, regular weight. */
const EXTRA: Record<string, number> = { '—': 1000, '–': 500, '’': 229, '‘': 229, '“': 377, '”': 377, '…': 733, '·': 217, '→': 863 };
/** Anything else: as wide as a capital, so it errs wide. */
const OTHER = 700;

function advance(ch: string, widths: readonly number[]): number {
  const code = ch.codePointAt(0)!;
  if (code >= 32 && code < 127) return widths[code - 32];
  if (EXTRA[ch] !== undefined) return EXTRA[ch];
  // An accented letter is as wide as its base letter (é as e).
  const base = ch.normalize('NFD')[0];
  if (base !== ch) return advance(base, widths);
  return OTHER;
}

/** The width of one line of text in scene units, at a size in px (1 unit = 1 px at design width). */
export function textWidth(text: string, size: number, weight?: 'bold'): number {
  const widths = WIDTHS[weight === 'bold' ? 'bold' : 'regular'];
  let total = 0;
  for (const ch of text) total += advance(ch, widths);
  return (total / 1000) * size * MARGIN;
}

/**
 * Text broken into lines no wider than `width`, at spaces. A word longer than the width keeps a
 * line of its own (a word is never broken). Without a width, the text stays one line.
 */
export function wrapText(text: string, size: number, width?: number, weight?: 'bold'): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (width === undefined || words.length < 2) return [words.join(' ')];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, weight) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines;
}
