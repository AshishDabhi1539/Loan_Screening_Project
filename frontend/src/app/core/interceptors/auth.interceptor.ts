import { Injectable, inject, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private injector = inject(Injector);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // Lazy getter to avoid circular dependency
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    // Add auth token to request
    const authReq = this.addTokenHeader(req);
    
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isAuthEndpoint(req.url)) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Add authorization header to request
   */
  private addTokenHeader(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getStoredToken();
    
    if (token) {
      return request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    
    return request;
  }

  /**
   * Handle 401 unauthorized errors with token refresh
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if we have a refresh token before attempting refresh
    const refreshToken = localStorage.getItem(environment.auth.refreshTokenKey) || 
                        sessionStorage.getItem(environment.auth.refreshTokenKey);
    
    if (!refreshToken) {
      // No refresh token available, logout immediately
      this.authService.logout();
      return throwError(() => new Error('No refresh token available'));
    }
    
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          const newToken = response.token || response.data?.token;
          this.refreshTokenSubject.next(newToken);
          
          // Retry the original request with new token
          return next.handle(this.addTokenHeader(request));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null); // Signal failure to waiting requests
          
          // Refresh failed, logout user
          this.authService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for refresh to complete, but timeout after 5 seconds
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          if (token) {
            return next.handle(this.addTokenHeader(request));
          } else {
            // Refresh failed, return error
            return throwError(() => new Error('Token refresh failed'));
          }
        })
      );
    }
  }

  /**
   * Check if the request is for an auth endpoint
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-email',
      '/auth/resend-otp',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/refresh-token'
    ];
    
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}