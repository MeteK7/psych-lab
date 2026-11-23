/**
 * The engine's start-up entry point (Stage 3, M0). Only what an application needs before anything
 * is drawn: its style pack. It holds no component, so importing it at start-up keeps the rest of
 * the engine out of the initial bundle (measured: through `index.ts`, the initial bundle grew by
 * about 108 kB; through this file, by about 3 kB). Everything else is in `index.ts`.
 */
export * from './styling/pack';
export * from './integration/style-pack';
