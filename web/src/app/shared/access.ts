import { inject } from '@angular/core';
import { CanActivateFn, ResolveFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { exerciseInfo, isExerciseId } from '../experiences/registry';
import { AppEnvironment } from './app-environment';

/**
 * Whether an exercise link may open here (M1). Checked before the page opens, once the build and
 * profile are known:
 * - a development-only exercise opens only in the development build (the API refuses its saves
 *   elsewhere too; this keeps the page from opening at all)
 * - in a booth, only exercises rated safe for unsupervised use open
 * A link that isn't an exercise at all is left to the page, which says the link is incomplete.
 */
export const exerciseAvailable: CanActivateFn = (route) => {
  const environment = inject(AppEnvironment);
  const router = inject(Router);
  const condition = route.queryParamMap.get('condition');
  if (!isExerciseId(condition)) return true;
  return environment.health$.pipe(
    map((health) => {
      const released = exerciseInfo(condition)?.release === 'released' || health?.environment === 'development';
      const offered = health?.profile !== 'booth' || !!health.booth?.exercises.includes(condition);
      return released && offered ? true : router.parseUrl('/not-available');
    }),
  );
};

/** Records, the experiment and the Lab never open in a booth, where they'd show other visitors' data. */
export const notInBooth: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AppEnvironment).health$.pipe(
    map((health) => (health?.profile === 'booth' ? router.parseUrl('/not-available') : true)),
  );
};

/** Tells the exercise page it runs in a booth, without the page asking the server itself. */
export const inBooth: ResolveFn<boolean> = () =>
  inject(AppEnvironment).health$.pipe(map((health) => health?.profile === 'booth'));
