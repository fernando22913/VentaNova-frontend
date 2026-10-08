import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthStore } from '../stores/auth.store';

/**
 * Route guards are UX only — the backend re-verifies the JWT and role on every
 * protected call. These just decide whether the browser navigates at all.
 */

/** Requires a session; sends the logged-out visitor to the login screen. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};

/** Only reachable when logged OUT (login/register pages). */
export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isLoggedIn()) return router.createUrlTree(['/']);
  return true;
};

/** Requires the ADMIN role; guests are sent to login, customers to home. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (!store.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  }
  return store.isAdmin() ? true : router.createUrlTree(['/']);
};
