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

/** Marks a request that has already been retried once after a refresh. */
const REFRESH_RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * Handles expired access tokens. On a 401 for a non-auth request it performs a
 * single refresh (deduplicated inside AuthStore), retries the original request
 * exactly once, and on failure clears the session and redirects to /login.
 *
 * Registered before `authInterceptor` so the retried request flows through it
 * again and picks up the freshly stored access token.
 */
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
