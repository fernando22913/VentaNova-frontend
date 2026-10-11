import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthStore } from '../stores/auth.store';

// Los guards son solo UX; el backend reverifica el JWT y el rol en cada llamada.

// Requiere sesión; envía a los visitantes sin sesión a la pantalla de login.
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};

// Solo accesible sin sesión (páginas de login/registro).
export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isLoggedIn()) return router.createUrlTree(['/']);
  return true;
};

// Requiere el rol ADMIN; los invitados van a login y los clientes a inicio.
export const adminGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (!store.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  }
  return store.isAdmin() ? true : router.createUrlTree(['/']);
};

// Requiere un rol de staff (ADMIN o WORKER) para el panel de operaciones.
export const workerGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (!store.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  }
  return store.isStaff() ? true : router.createUrlTree(['/']);
};
