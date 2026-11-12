import { Mover } from '../../shared/visual/motion/plan-motion';
import { EMPHASIS_CHANGE, MOTION, MOTION_EFFECTS, MOVE_CHANGE } from '../../shared/visual/styling/vocabulary';

/** What a mover does, in words, with the S1 timing it gets: the Lab's reviewable summary of a change. */
export function describeMover(m: Mover): { id: string; what: string; why: string } {
  const ms = (d: keyof typeof MOTION.durations) => `${MOTION.durations[d]} ms`;
  const along = m.with.length ? `, with ${m.with.join(', ')}` : '';
  if (m.change.kind === 'emphasis')
    return { id: m.id, what: `eases from ${m.change.from} to ${m.change.to} emphasis (${ms(EMPHASIS_CHANGE.duration)})`, why: '' };
  if (m.change.kind === 'moves')
    return { id: m.id, what: `glides to its new place and shape (${ms(MOVE_CHANGE.duration)})${along}, as one movement`, why: m.change.why.join(' ') };
  const verb = { fade: 'fades in', rise: 'rises into place', draw: 'is drawn along its direction' }[m.change.effect];
  return { id: m.id, what: `${verb} (${ms(MOTION_EFFECTS[m.change.effect].duration)})${along}`, why: m.change.why };
}
