import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';

interface ApiErrorBody {
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
}

// Muestra los fallos de la API como toasts (con detalles de campos, salvo 401) y relanza.
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status !== 401) {
          const body = error.error as ApiErrorBody | undefined;
          let message =
            body?.error?.message ?? (error.status ? `Error ${error.status}` : 'Error de red');
          const details = body?.error?.details;
          if (details?.length) {
            const fields = details.map((detail) => `${detail.path}: ${detail.message}`).join(' · ');
            message = `${message} — ${fields}`;
          }
          toasts.show(message, 'error');
        }
      } else {
        toasts.show('Error inesperado', 'error');
      }
      return throwError(() => error);
    }),
  );
};
