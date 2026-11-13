import type { ImageProvider } from '../../src/app/shared/visual/assets/generate';
import { LOCAL_TEST_PROVIDER } from './local-test-provider';

// The providers the authoring script may use (Visual System M7 stage C).
//
// No AI provider is here, so generated images are off: there is no setting to turn on. Adding a
// real provider is its own proposal (docs/plan.md §10 keeps generative AI as a deferred decision):
// which service, its cost, what it is sent, its licence, and where its key lives. The one entry
// below is the local test provider: a fixed, hand-written picture, with no network.
export const PROVIDERS: Readonly<Record<string, ImageProvider>> = {
  [LOCAL_TEST_PROVIDER.id]: LOCAL_TEST_PROVIDER,
};
