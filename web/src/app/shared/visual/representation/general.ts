import { Representation } from './contract';
import { ADDS, baseLacks, bases, drawComposition } from './compose';
import { Registry } from './dispatch';
import { FieldTuning } from './idioms/field';
import { KineticTuning } from './idioms/kinetic';
import { SpatialTuning } from './idioms/spatial';
import { needs } from './needs';
import { dependencyField, dependencyKinetic, dependencyLacks, dependencySpatial } from './patterns/dependency';
import { feltField, feltKinetic, feltLacks, feltSpatial } from './patterns/felt';
import { DEPENDENCY, FELT, Lists, MOTION } from './patterns/lists';
import { motionField, motionFieldLacks, motionKinetic, motionLacks, motionSpatial } from './patterns/motion';
import { EngineIdiom, Figure, Setting, Subject } from './setting';

/**
 * S12: the engine's general patterns, registered (Stage 3, M3). Three patterns in each of the
 * engine's three idioms (motion, with carrying; dependency; felt), each a composition base too, and
 * each idiom's additions. An application registers its own prepared compositions first, if it wants
 * them to win ties, then these.
 */

/** What every pattern is drawn with: the application's setting, the idiom's tuning, and the finishing asked for. */
export interface DrawContext {
  setting: Setting;
  tuning: object;
  finish: object;
}

const subject = (rep: Representation, x: DrawContext): Subject => ({ rep, setting: x.setting });

interface General {
  name: string;
  lists: Lists;
  lacks: Record<EngineIdiom, (c: Subject) => string[]>;
  draw: { kinetic(c: Subject, t: KineticTuning): Figure; spatial(c: Subject, t: SpatialTuning): Figure; field(c: Subject, t: FieldTuning): Figure };
}

const GENERAL: readonly General[] = [
  // Things that move, meet and move one another; with carrying (revisions 5 and 6).
  { name: 'motion', lists: MOTION, lacks: { kinetic: motionLacks, spatial: motionLacks, field: motionFieldLacks }, draw: { kinetic: motionKinetic, spatial: motionSpatial, field: motionField } },
  // A dependency with parts of one whole (revision 6); as a field, one of clarity.
  {
    name: 'dependency',
    lists: DEPENDENCY,
    lacks: { kinetic: dependencyLacks, spatial: dependencyLacks, field: (c) => needs.all(needs.quality(c, 'clarity'), dependencyLacks(c)) },
    draw: { kinetic: dependencyKinetic, spatial: dependencySpatial, field: dependencyField },
  },
  // A reported feeling in a place, with no exchange (revision 6); as a field, one of agitation.
  {
    name: 'felt',
    lists: FELT,
    lacks: { kinetic: feltLacks, spatial: feltLacks, field: (c) => needs.all(needs.quality(c, 'agitation'), feltLacks(c)) },
    draw: { kinetic: feltKinetic, spatial: feltSpatial, field: feltField },
  },
];

export const ENGINE_IDIOMS: readonly EngineIdiom[] = ['kinetic', 'spatial', 'field'];

/** Registers the general patterns, the composition bases and the additions, in each of the engine's idioms. */
export function registerGeneral<C extends DrawContext, F extends Figure>(registry: Registry<C, F>): Registry<C, F> {
  for (const idiom of ENGINE_IDIOMS) {
    for (const g of GENERAL)
      registry.register({
        name: g.name,
        idiom,
        draws: g.lists.draws,
        single: g.lists.single,
        lacks: (rep, x) => g.lacks[idiom](subject(rep, x)),
        draw: (rep, x) => g.draw[idiom](subject(rep, x), x.tuning as never) as F,
      });
    for (const b of bases())
      registry.registerBase({
        name: b.name,
        idiom,
        draws: b.lists.draws,
        single: b.lists.single,
        domain: (rep, x) => b.domain(subject(rep, x)),
        lacks: (sub, rest, x) => baseLacks(b, idiom, subject(sub, x), rest),
      });
    registry.registerAdditions(idiom, {
      adds: ADDS[idiom],
      draw: (plan, rep, x) => drawComposition(subject(rep, x), idiom, x.finish, { base: bases().find((b) => b.name === plan.base)!, rest: plan.rest, sub: subject(plan.sub, x) }) as unknown as F,
    });
  }
  return registry;
}
