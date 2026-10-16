import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        void router.navigateByUrl('/login');
      } else {
        toast.show(getFriendlyErrorMessage(error), 'error');
      }
      return throwError(() => error);
    }),
  );
};

export function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.status === 401) {
    return 'Email or password is incorrect.';
  }

  const problem = asRecord(error.error);
  if (problem) {
    if (typeof problem['title'] === 'string' && problem['title'].trim()) {
      return problem['title'];
    }

    const validationMessages = getValidationMessages(problem['errors']);
    if (validationMessages.length > 0) {
      return validationMessages.slice(0, 3).join(' ');
    }

    if (typeof problem['detail'] === 'string' && problem['detail'].trim()) {
      return problem['detail'];
    }
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  if (error.status === 403) {
    return 'You do not have permission to do that.';
  }
  if (error.status === 404) {
    return 'The requested item could not be found.';
  }
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (error.status >= 500) {
    return 'The server could not complete your request. Please try again.';
  }
  return 'The request could not be completed. Please check your information and try again.';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : null;
}

function getValidationMessages(value: unknown): string[] {
  const errors = asRecord(value);
  if (!errors) {
    return [];
  }

  return Object.values(errors).flatMap((message) => {
    if (typeof message === 'string') {
      return [message];
    }
    return Array.isArray(message)
      ? message.filter((entry): entry is string => typeof entry === 'string')
      : [];
  });
}
