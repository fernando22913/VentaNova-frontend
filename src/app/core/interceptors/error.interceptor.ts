import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';

interface ApiErrorBody {
  error?: { message?: string };
}

/**
 * Surfaces API failures as toasts, extracting the message from the standard
 * `{ error: { message } }` envelope. 401s are left to the refresh interceptor
 * (and are not toasted), because an expired token is expected and recoverable.
 * Always re-throws so callers keep the real error.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status !== 401) {
          const body = error.error as ApiErrorBody | undefined;
          const message =
            body?.error?.message ?? (error.status ? `Error ${error.status}` : 'Error de red');
          toasts.show(message, 'error');
        }
      } else {
        toasts.show('Error inesperado', 'error');
      }
      return throwError(() => error);
    }),
  );
};
