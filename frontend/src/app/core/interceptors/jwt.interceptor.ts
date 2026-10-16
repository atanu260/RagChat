import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const apiBaseUrl = environment.apiUrl.replace(/\/+$/, '');

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token();
  const isApiRequest = request.url === apiBaseUrl || request.url.startsWith(`${apiBaseUrl}/`);
  if (!token || !isApiRequest) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
