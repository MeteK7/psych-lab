import type { Drawable } from './frame';

/** Every drawable as SVG path data, so one element type carries all paint. */
export function pathData(shape: Drawable): string {
  switch (shape.type) {
    case 'path':
      return shape.d;
    case 'line':
      return `M${shape.x1} ${shape.y1} L${shape.x2} ${shape.y2}`;
    case 'circle': {
      const { cx, cy, r } = shape;
      return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
    }
    case 'ellipse': {
      const { cx, cy, rx, ry } = shape;
      return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    }
    case 'rect': {
      const { x, y, width: w, height: h } = shape;
      const r = Math.min(shape.rx ?? 0, w / 2, h / 2);
      if (!r) return `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
      return (
        `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} ` +
        `A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
        `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
      );
    }
  }
}
