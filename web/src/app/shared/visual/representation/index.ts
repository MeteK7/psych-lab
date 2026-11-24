/**
 * S12 Representation (Stage 3; docs/visual-engine-stage-3-proposal.md). M1: the contract, its
 * well-formedness check, and the invariants every figure keeps. M2: the dispatch (needs, choice,
 * refusal, composition, registration). M3: the three idioms, the general patterns and the additions,
 * the setting an application draws them in, and the drawing kit (`kit`), which an application's
 * prepared compositions draw with too.
 */
export * from './contract';
export * from './check';
export * from './invariants';
export * from './dispatch';
export { needs } from './needs';
export type { Axes, EngineIdiom, Figure, FigureMotion, Setting, Subject } from './setting';
export type { KineticTuning, Unscaled } from './idioms/kinetic';
export { KINETIC_RULES } from './idioms/kinetic';
export type { SpatialTuning } from './idioms/spatial';
export { SPATIAL_RULES } from './idioms/spatial';
export type { FieldTuning } from './idioms/field';
export { FIELD_RULES } from './idioms/field';
export { FORM_FEATURES } from './kit/forms';
export type { Lists } from './patterns/lists';
export { GENERAL_LISTS } from './patterns/lists';
export type { DrawContext } from './general';
export { ENGINE_IDIOMS, registerGeneral } from './general';
export * as kit from './kit';
export * as probe from './testing/probe';
