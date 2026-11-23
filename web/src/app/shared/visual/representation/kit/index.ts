/**
 * S12 drawing kit (Stage 3, M3): the parts the engine's patterns draw with, and an application's
 * prepared compositions too. Exported as one namespace (`kit`), so its plain names (`path`, `label`,
 * `ring` …) don't crowd the engine's entry point.
 */
export * from './elements';
export * from './forms';
export * from './paths';
export * from './spatial';
export * from './field';

// The idioms' shared parts, and the figure's composition and coverage (setting.ts).
export { CX, CY, countOf, openRange, presence, ring, roundedRect } from '../idioms/kinetic';
export { centreOf, corners, keysFor, stances } from '../idioms/spatial';
export { AREA, headingElements, headings } from '../idioms/field';
export { SAFE, composed, coverage } from '../setting';
