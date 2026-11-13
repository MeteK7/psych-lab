/**
 * S8 Assets: an SVG file that is safe to keep (milestone M7 stage C). A file from outside the
 * project's own code (a generator's output, a hand-made picture) is data to be distrusted: it must
 * be a plain picture that runs nothing and fetches nothing. Checked when a generated candidate
 * comes in, and for every SVG in the catalogue by a spec. Pure: works on the file's text.
 */
const FORBIDDEN: [pattern: RegExp, what: string][] = [
  [/<!DOCTYPE|<!ENTITY/i, 'a DOCTYPE or an entity'],
  [/<\s*script/i, 'a script'],
  [/<\s*(foreignObject|iframe|embed|object|audio|video)\b/i, 'embedded content'],
  [/<\s*(image|feImage)\b/i, 'an embedded image'],
  [/\son[a-z]+\s*=/i, 'an event handler'],
  [/javascript:/i, 'a javascript link'],
  [/@import/i, 'an imported stylesheet'],
  [/<\s*(a|animate|set|animateTransform|animateMotion)\b/i, 'a link or an animation'],
];

/** Every problem with an SVG file's text; empty when it's a plain, self-contained picture. */
export function svgProblems(text: string): string[] {
  const problems: string[] = [];
  if (!/^\s*(<\?xml[^>]*\?>\s*)?<svg[\s>]/.test(text) || !/<\/svg>\s*$/.test(text)) problems.push("it isn't one SVG element");
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(text)) problems.push('it lacks the SVG namespace');
  for (const [pattern, what] of FORBIDDEN) if (pattern.test(text)) problems.push(`it has ${what}`);
  // References stay inside the file: `#id` only, in links and in `url()`.
  for (const m of text.matchAll(/\b(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)) if (!m[1].startsWith('#')) problems.push('it refers to something outside itself');
  for (const m of text.matchAll(/url\(\s*["']?([^"')]*)/gi)) if (!m[1].startsWith('#')) problems.push('it refers to something outside itself');
  // The one address allowed is the namespace itself.
  if (/https?:\/\//i.test(text.replace(/xmlns(:\w+)?="[^"]*"/g, ''))) problems.push('it names a web address');
  return [...new Set(problems)];
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Whether bytes begin as a PNG file does. */
export function isPng(data: Uint8Array): boolean {
  return data.length > PNG_SIGNATURE.length && PNG_SIGNATURE.every((b, i) => data[i] === b);
}
