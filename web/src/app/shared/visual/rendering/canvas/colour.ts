/**
 * S7 Rendering: colours for the canvas (milestone M6). A canvas doesn't follow CSS, so a surface
 * resolves each S1 token reference in its own styles (light, dark and forced colours alike), and
 * eases between two colours as the browser does in an animation: in sRGB with premultiplied alpha.
 */

/** Reads a colour the frame names (an S1 token reference, or 'none') as the canvas can use it. */
export type ColourOf = (value: string) => string;

/**
 * Token colours as `host` resolves them now. Read again at most once a second, so a change of
 * scheme shows at once enough; `forget` clears them at once (a pinned scheme changed).
 */
export function tokenColours(host: HTMLElement): ColourOf & { forget(): void } {
  const colours = new Map<string, string>();
  let at = 0;
  const resolve = (value: string): string => {
    const now = performance.now();
    if (now - at > 1000) {
      colours.clear();
      at = now;
    }
    let resolved = colours.get(value);
    if (resolved === undefined) {
      const probe = document.createElement('span');
      probe.style.display = 'none';
      probe.style.color = value;
      host.append(probe);
      resolved = getComputedStyle(probe).color;
      probe.remove();
      colours.set(value, resolved);
    }
    return resolved;
  };
  return Object.assign(resolve, { forget: () => colours.clear() });
}

type Rgba = [number, number, number, number];

/** A resolved CSS colour (`rgb()`, `rgba()`, `color(srgb …)`, hex, `transparent`) as 0–255 channels and alpha. */
export function parseColour(css: string): Rgba {
  const value = css.trim();
  if (value === 'transparent' || value === 'none' || value === '') return [0, 0, 0, 0];
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as Rgba;
  const rgb = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3], alpha(rgb[4])];
  const srgb = value.match(/^color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (srgb) return [+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255, alpha(srgb[4])];
  throw new Error(`Unreadable colour '${css}'`);
}

function alpha(value: string | undefined): number {
  if (value === undefined) return 1;
  return value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value);
}

/** A fraction `f` of the way from one colour to another, premultiplied, as the browser animates colour. */
export function mixColours(from: string, to: string, f: number): string {
  const [a, b] = [parseColour(from), parseColour(to)];
  const alphaMix = a[3] + (b[3] - a[3]) * f;
  if (alphaMix <= 0) return 'rgba(0, 0, 0, 0)';
  const channel = (i: number) => (a[i] * a[3] + (b[i] * b[3] - a[i] * a[3]) * f) / alphaMix;
  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alphaMix})`;
}
