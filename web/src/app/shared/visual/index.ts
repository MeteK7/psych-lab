/**
 * The engine's public entry point (Stage 3, M0; docs/visual-engine-stage-3-proposal.md §3, rule 12c).
 * Code outside `shared/visual/` reaches the engine through this file, or, at start-up, through
 * `start.ts` (the style pack only, so the initial bundle stays small). Deep imports that existed
 * before M0 are pinned in `testing/pinned-deep-imports.ts` and may only shrink (rule 10,
 * `dependency-rules.spec.ts`); new code imports from here.
 *
 * What an application uses: the visual contract and its slots, the scene and instrument sources,
 * the composition types, and the style pack it brings.
 */

// The contract an exercise asks through, and where a visual appears.
export * from './visual';
export * from './visual-slot';

// Integration (S9): sources, slots and figures.
export * from './integration/scene-source';
export * from './integration/card-figures';
export * from './integration/instruments';
export * from './integration/instrument-slot';
export * from './integration/viewpoint-slot';
export * from './integration/tracking';
export * from './integration/style-pack';

// Compositions built from data (S3), and the vocabulary they are written in (S1).
export * from './composition/scene';
export * from './composition/compose';
export * from './styling/vocabulary';

// The style pack an application brings (S1, M0).
export * from './styling/pack';

// S12 Representation (Stage 3, M1): the contract, its check, and the invariants every figure keeps.
export * from './representation';
