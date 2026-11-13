import type { ResolvedFrame } from '../frame';
import { ExportFacts, SVG_EXPORTER, frameToSvg } from './svg-export';

/** Token colours as a browser would resolve them. */
const COLOURS: Record<string, string> = {
  'var(--vis-subject)': 'rgb(55, 102, 199)',
  'var(--vis-subject-fill)': 'rgb(228, 237, 255)',
  'var(--vis-subject-lit)': 'rgb(243, 247, 255)',
  'var(--vis-near)': 'rgb(200, 219, 255)',
  'var(--vis-translucent)': 'color(srgb 0.462745 0.639216 0.980392 / 0.35)',
  'var(--vis-shadow)': 'rgba(42, 43, 46, 0.1)',
  'var(--vis-shadow-edge)': 'rgba(42, 43, 46, 0)',
  'var(--vis-ground)': 'rgb(255, 255, 255)',
  'var(--vis-label)': 'rgb(28, 28, 30)',
  'var(--vis-grain)': 'rgb(28, 28, 30)',
};
const colour = (value: string) => COLOURS[value] ?? 'rgb(0, 0, 0)';

const facts: ExportFacts = { id: 'test.figure', version: 3, state: 'plan', theme: 'action', themeVersion: 1, scheme: 'light', seed: 's-1', alt: 'A path & a "wish" <ahead>' };

const frame: ResolvedFrame = {
  width: 480,
  height: 120,
  theme: 'action',
  grain: { tile: 64, d: 'M1 1 h1 v1 h-1 Z' },
  items: [
    { kind: 'shape', id: 'plane', layer: 'l', shape: { type: 'rect', x: 0, y: 60, width: 480, height: 60 }, paint: { fill: 'var(--vis-near)', stroke: 'none', width: 0, dash: null, grain: 0.05 } },
    { kind: 'shape', id: 'path', layer: 'l', shape: { type: 'line', x1: 40, y1: 80, x2: 440, y2: 80 }, paint: { fill: 'none', stroke: 'var(--vis-subject)', width: 2.5, dash: '7 7' } },
    {
      kind: 'shape',
      id: 'ball',
      layer: 'l',
      shape: { type: 'circle', cx: 240, cy: 60, r: 20 },
      paint: {
        fill: 'var(--vis-subject-fill)',
        stroke: 'var(--vis-subject)',
        width: 2,
        dash: null,
        gradient: { type: 'linear', from: [0, 0], to: [1, 1], stops: [{ offset: 0, colour: 'var(--vis-subject-lit)' }, { offset: 1, colour: 'var(--vis-subject-fill)' }] },
      },
    },
    {
      kind: 'shape',
      id: 'shadow',
      layer: 'l',
      shape: { type: 'ellipse', cx: 240, cy: 84, rx: 24, ry: 5 },
      paint: { fill: 'none', stroke: 'none', width: 0, dash: null, gradient: { type: 'radial', stops: [{ offset: 0, colour: 'var(--vis-shadow)' }, { offset: 1, colour: 'var(--vis-shadow-edge)' }] } },
    },
    { kind: 'shape', id: 'veil', layer: 'l', shape: { type: 'circle', cx: 100, cy: 40, r: 10 }, paint: { fill: 'var(--vis-translucent)', stroke: 'none', width: 0, dash: null } },
    { kind: 'text', id: 'label', layer: 'l', text: 'Now & then', x: 40, y: 104, anchor: 'start', fill: 'var(--vis-label)', size: 14, weight: 'bold' },
    {
      kind: 'text',
      id: 'wrapped',
      layer: 'l',
      text: 'two lines',
      x: 440,
      y: 100,
      anchor: 'end',
      fill: 'var(--vis-label)',
      size: 13,
      lines: ['two', 'lines'],
      lineHeight: 15.6,
      halo: { colour: 'var(--vis-ground)', width: 4 },
    },
  ],
};

describe('a frame as a standalone SVG (M7)', () => {
  const svg = frameToSvg(frame, colour, facts);

  it('is well-formed, sized as the frame, with the text alternative and a record of what it is', () => {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    const root = doc.documentElement;
    expect([root.getAttribute('viewBox'), root.getAttribute('width'), root.getAttribute('height')]).toEqual(['0 0 480 120', '480', '120']);
    expect(doc.querySelector('title')!.textContent).toBe('A path & a "wish" <ahead>');
    expect(JSON.parse(doc.querySelector('metadata')!.textContent!)).toEqual({
      exporter: SVG_EXPORTER,
      id: 'test.figure',
      version: 3,
      state: 'plan',
      theme: 'action',
      themeVersion: 1,
      scheme: 'light',
      seed: 's-1',
    });
  });

  it('resolves every colour: no token reference, no stylesheet, see-through colours as opacity', () => {
    expect(svg).not.toMatch(/var\(|<style|rgb\(|color\(/);
    expect(svg).toContain('<path d="M40 80 L440 80" fill="none" stroke="#3766c7" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-dasharray="7 7"/>');
    expect(svg).toContain('fill="#76a3fa" fill-opacity="0.35" stroke="none"/>');
  });

  it('keeps gradients in the shape’s own box, grain as a pattern, and text as text', () => {
    expect(svg).toContain('<linearGradient id="vis-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f7ff"/><stop offset="1" stop-color="#e4edff"/></linearGradient>');
    expect(svg).toContain('<radialGradient id="vis-g2"><stop offset="0" stop-color="#2a2b2e" stop-opacity="0.1"/><stop offset="1" stop-color="#2a2b2e" stop-opacity="0"/></radialGradient>');
    expect(svg).toContain('fill="url(#vis-g1)" stroke="#3766c7" stroke-width="2" vector-effect="non-scaling-stroke"/>');
    expect(svg).toContain('<pattern id="vis-grain" patternUnits="userSpaceOnUse" width="64" height="64">');
    expect(svg).toContain('fill="url(#vis-grain)" opacity="0.05" stroke="none"/>');
    expect(svg).toContain('<text x="40" y="104" text-anchor="start" font-size="14" font-weight="700" fill="#1c1c1e">Now &amp; then</text>');
    expect(svg).toContain(
      '<text x="440" y="100" text-anchor="end" font-size="13" fill="#1c1c1e" stroke="#ffffff" stroke-width="4" paint-order="stroke"><tspan x="440" y="100">two</tspan><tspan x="440" y="115.6">lines</tspan></text>',
    );
    expect(svg).toContain(`font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"`);
  });

  it('draws the items in the frame’s order', () => {
    const order = ['M0 60 H480', 'M40 80 L440 80', 'M220 60 A20', 'M216 84 A24', 'M90 40 A10', 'Now &amp; then', '>two<'].map((part) => svg.indexOf(part));
    expect(order.every((at) => at > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('gives the same bytes every time, with no date or machine in them', () => {
    expect(frameToSvg(frame, colour, facts)).toBe(svg);
    expect(svg).not.toMatch(/\d{4}-\d{2}-\d{2}|localhost|Users/);
    expect(svg.endsWith('</svg>\n')).toBe(true);
  });
});
