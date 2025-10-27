import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip auth header for auth endpoints
  const authEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh-token'
  ];

  const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));
  
  // Add auth header if user is authenticated and not an auth endpoint
  let authReq = req;
  const token = authService.getToken();
  
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && authService.isAuthenticated()) {
        // Token expired or invalid - logout user
        authService.logout();
      }
      
      // Re-throw error
      return throwError(() => error);
    })
  );
};
