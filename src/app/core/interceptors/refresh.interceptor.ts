import {
  HttpContextToken,
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AuthStore } from '../stores/auth.store';
import { isAuthEndpoint } from './auth-endpoints';

// Marca una petición ya reintentada una vez tras un refresh.
const REFRESH_RETRIED = new HttpContextToken<boolean>(() => false);

// Ante un 401 de una petición no-auth: refresca una vez, reintenta una vez; si no, limpia sesión y va a /login.
export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!unauthorized || isAuthEndpoint(request.url) || request.context.get(REFRESH_RETRIED)) {
        return throwError(() => error);
      }

      return from(store.refreshAccessToken()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            void router.navigate(['/login']);
            return throwError(() => error);
          }
          const retry = request.clone({ context: request.context.set(REFRESH_RETRIED, true) });
          return next(retry);
        }),
      );
    }),
  );
};
