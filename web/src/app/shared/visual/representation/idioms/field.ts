import type { SceneElement } from '../../composition/scene';
import { Statement } from '../contract';
import { SAFE } from '../setting';
import { path } from '../kit/elements';
import { Area, streamline } from '../kit/field';
import { Pt, polyline } from '../kit/paths';
import { FRAME } from '../kit/spatial';

/**
 * S12: the field idiom (Stage 3, M3; the representation study's idioms.md, F1–F7): the frame is a
 * field of fine lines whose order, spacing and tightness carry the meaning. Flat; moving only when the
 * field facet says it evolves; metaphorical unless the field is the thing itself (a flow).
 */
/** What the engine's field patterns read. An application's own patterns may extend it. */
export interface FieldTuning {
  /** F5: how long an evolving field grows, ms. */
  evolveMs: number;
  /** F1 with C5: how far from its source the field reaches, so a third of the frame stays calm. */
  reach: number;
  /** F4: lines per possible heading, how far from the source they start, and their common turn (radians). */
  perHeading: number;
  headingStart: number;
  turn: number;
  /** F2 agitation: how tight the contours are near the source (units at the first level). */
  tightness: number;
  /** F3, F7: marks and labels. */
  labels: boolean;
}

export const FIELD_RULES: FieldTuning = {
  evolveMs: 6000,
  reach: 170,
  // R4-1 (revision 4): the accepted P1-F1 values, needed five times, are the rule.
  perHeading: 4,
  headingStart: 76,
  turn: 0.6,
  tightness: 70,
  labels: true,
};

/** The field's area: the frame inside its safe margin. */
export const AREA: Area = { x: SAFE, y: SAFE, width: FRAME.width - 2 * SAFE, height: FRAME.height - 2 * SAFE };

/** F4: `n` headings of equal strength around a point, each a sector of outward lines with a common turn. */
export function headings(centre: Pt, n: number, t: FieldTuning, clear: (p: Pt) => boolean = () => true, reach = t.reach): Pt[][][] {
  return Array.from({ length: n }, (_, k) => {
    const mid = -Math.PI / 2 + ((k + 0.5) / n) * Math.PI * 2;
    const width = (Math.PI * 2) / n;
    const lines: Pt[][] = [];
    for (let j = 0; j < t.perHeading; j++) {
      const a = mid - width * 0.32 + (width * 0.64 * j) / Math.max(1, t.perHeading - 1);
      const start: Pt = [centre[0] + Math.cos(a) * t.headingStart * 0.6, centre[1] + Math.sin(a) * t.headingStart * 0.6];
      const vec = (p: Pt) => {
        if (Math.hypot(p[0] - centre[0], p[1] - centre[1]) > reach) return null;
        const th = Math.atan2(p[1] - centre[1], p[0] - centre[0]) + t.turn;
        return [Math.cos(th), Math.sin(th)] as const;
      };
      const pts = streamline(start, vec, AREA, 4, reach).filter(clear);
      if (pts.length > 3) lines.push(pts);
    }
    return lines;
  });
}

export function headingElements(lines: Pt[][][], open: number, set: Statement | undefined, also: readonly string[]): SceneElement[] {
  if (open <= 0.002) return [];
  return lines.flatMap((ls, k) =>
    ls.length ? [path(`heading-${k + 1}`, ls.map((l) => polyline(l.slice(0, Math.max(2, Math.round(l.length * open))))).join(''), { role: 'context', line: 'hair', dash: 'tentative' }, [...(set ? [set.id] : []), ...also], 'One possible heading: as many lines and as long as every other, unresolved.')] : [],
  );
}
