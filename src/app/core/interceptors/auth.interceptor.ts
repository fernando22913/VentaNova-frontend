import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';

import { AuthStore } from '../stores/auth.store';
import { isAuthEndpoint } from './auth-endpoints';

/**
 * Attaches `Authorization: Bearer <access token>` to outgoing requests when a
 * session exists. The backend is the real enforcement — this only carries the
 * credential. Auth endpoints (login/register/refresh/logout) are skipped so a
 * stale access token is never attached to them.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthStore);
  const token = store.currentToken();

  if (!token || isAuthEndpoint(request.url)) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
