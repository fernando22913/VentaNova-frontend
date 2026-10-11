import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';

import { AuthStore } from '../stores/auth.store';
import { isAuthEndpoint } from './auth-endpoints';

// Adjunta el token Bearer cuando hay sesión; se omiten los endpoints de auth.
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthStore);
  const token = store.currentToken();

  if (!token || isAuthEndpoint(request.url)) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
