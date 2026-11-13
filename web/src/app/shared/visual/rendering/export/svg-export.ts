import { ColourOf, parseColour } from '../canvas/colour';
import type { DrawPaint, FrameItem, ResolvedFrame } from '../frame';
import { pathData } from '../path-data';

/**
 * S7 Rendering: a resolved frame as a standalone SVG file (milestone M7). It draws what the SVG
 * backend draws, with every colour resolved (`colour` turns a token reference into the colour of one
 * theme and scheme), so the file needs no stylesheet: lines keep their width at any size, gradients
 * run in the shape's own box, grain is a pattern, a halo is the text's own stroke behind its fill.
 * Text stays text, in the platform's font stack. A `<title>` carries the text alternative and a
 * `<metadata>` block says exactly what the picture is. Pure and deterministic: the same frame,
 * colours and facts give the same bytes, with no date or machine in them.
 */

/** Recorded in each file: which exporter made it. Bumped when the output changes. */
export const SVG_EXPORTER = 'visual-system.svg-export.v1';
export const FONT_STACK = "system-ui, -apple-system, 'Segoe UI', sans-serif";

/** What an exported picture is, exactly: enough to make it again. */
export interface ExportFacts {
  /** The composition or scene, and its version. */
  id: string;
  version: number;
  /** A scene's state; absent for a composition built from data. */
  state?: string;
  theme: string;
  themeVersion: number;
  scheme: 'light' | 'dark';
  seed?: string;
  /** The text alternative, in words. */
  alt: string;
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n: number) => String(Math.round(n * 1000) / 1000);
const hex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');

/** A colour as attributes: `name="#rrggbb"`, with `name-opacity` when it is see-through; `none` stays none. */
function paintAttr(name: 'fill' | 'stroke' | 'stop-color', value: string, colour: ColourOf): string {
  if (value === 'none') return ` ${name}="none"`;
  const [r, g, b, a] = parseColour(colour(value));
  const opacity = name === 'stop-color' ? 'stop-opacity' : `${name}-opacity`;
  return ` ${name}="#${hex(r)}${hex(g)}${hex(b)}"${a < 1 ? ` ${opacity}="${num(a)}"` : ''}`;
}

function strokeAttrs(paint: DrawPaint, colour: ColourOf): string {
  if (paint.stroke === 'none' || !(paint.width > 0)) return ' stroke="none"';
  return `${paintAttr('stroke', paint.stroke, colour)} stroke-width="${num(paint.width)}" vector-effect="non-scaling-stroke"${paint.dash ? ` stroke-dasharray="${paint.dash}"` : ''}`;
}

function textElement(item: Extract<FrameItem, { kind: 'text' }>, colour: ColourOf): string {
  const halo = item.halo ? `${paintAttr('stroke', item.halo.colour, colour)} stroke-width="${num(item.halo.width)}" paint-order="stroke"` : '';
  const attrs = `x="${num(item.x)}" y="${num(item.y)}" text-anchor="${item.anchor}" font-size="${num(item.size)}"${item.weight === 'bold' ? ' font-weight="700"' : ''}${paintAttr('fill', item.fill, colour)}${halo}`;
  const body = item.lines
    ? item.lines.map((line, i) => `<tspan x="${num(item.x)}" y="${num(item.y + i * (item.lineHeight ?? 0))}">${escape(line)}</tspan>`).join('')
    : escape(item.text);
  return `<text ${attrs}>${body}</text>`;
}

export function frameToSvg(frame: ResolvedFrame, colour: ColourOf, facts: ExportFacts): string {
  const defs: string[] = [];
  const body: string[] = [];
  if (frame.grain && frame.items.some((i) => i.kind === 'shape' && i.paint.grain))
    defs.push(
      `<pattern id="vis-grain" patternUnits="userSpaceOnUse" width="${num(frame.grain.tile)}" height="${num(frame.grain.tile)}"><path d="${frame.grain.d}"${paintAttr('fill', 'var(--vis-grain)', colour)}/></pattern>`,
    );
  let gradients = 0;
  for (const item of frame.items) {
    if (item.kind === 'text') {
      body.push(textElement(item, colour));
      continue;
    }
    const { paint } = item;
    const d = pathData(item.shape);
    let fill = paintAttr('fill', paint.fill, colour);
    if (paint.gradient) {
      const id = `vis-g${++gradients}`;
      const stops = paint.gradient.stops.map((s) => `<stop offset="${num(s.offset)}"${paintAttr('stop-color', s.colour, colour)}/>`).join('');
      defs.push(
        paint.gradient.type === 'linear'
          ? `<linearGradient id="${id}" x1="${num(paint.gradient.from[0])}" y1="${num(paint.gradient.from[1])}" x2="${num(paint.gradient.to[0])}" y2="${num(paint.gradient.to[1])}">${stops}</linearGradient>`
          : `<radialGradient id="${id}">${stops}</radialGradient>`,
      );
      fill = ` fill="url(#${id})"`;
    }
    body.push(`<path d="${d}"${fill}${strokeAttrs(paint, colour)}/>`);
    if (paint.grain && frame.grain) body.push(`<path d="${d}" fill="url(#vis-grain)" opacity="${num(paint.grain)}" stroke="none"/>`);
  }
  const { alt, ...what } = facts;
  const metadata = JSON.stringify({ exporter: SVG_EXPORTER, ...what });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(frame.width)} ${num(frame.height)}" width="${num(frame.width)}" height="${num(frame.height)}" fill="none" stroke-linecap="round" stroke-linejoin="round" font-family="${escape(FONT_STACK)}">`,
    `<title>${escape(alt)}</title>`,
    `<metadata>${escape(metadata)}</metadata>`,
    ...(defs.length ? [`<defs>${defs.join('')}</defs>`] : []),
    ...body,
    '</svg>',
    '',
  ].join('\n');
}
