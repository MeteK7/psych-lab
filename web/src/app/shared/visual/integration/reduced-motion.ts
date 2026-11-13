import { signal } from '@angular/core';

const REDUCE = '(prefers-reduced-motion: reduce)';

/** The person's motion preference, kept current while the page is open. */
export function reducedMotion() {
  const query = typeof matchMedia === 'function' ? matchMedia(REDUCE) : null;
  const reduce = signal(query?.matches ?? false);
  query?.addEventListener?.('change', (e) => reduce.set(e.matches));
  return reduce.asReadonly();
}
