import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = this.extractErrorMessage(error) || 'Bad Request';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 403:
              errorMessage = 'Access forbidden';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 409:
              errorMessage = this.extractErrorMessage(error) || 'Conflict occurred';
              break;
            case 422:
              errorMessage = this.extractErrorMessage(error) || 'Validation failed';
              break;
            case 500:
              errorMessage = 'Internal server error';
              break;
            case 503:
              errorMessage = 'Service unavailable';
              break;
            default:
              errorMessage = `Server Error: ${error.status} - ${error.message}`;
          }
        }

        // Log error for debugging (suppress logout errors as they're expected)
        if (!req.url.includes('/auth/logout')) {
          console.error('HTTP Error:', {
            status: error.status,
            message: errorMessage,
            url: error.url,
            error: error.error
          });
        }

        // Handle specific error scenarios
        if (error.status === 401) {
          // Redirect to login for unauthorized access
          this.router.navigate(['/auth/login']);
        }

        return throwError(() => ({
          ...error,
          userMessage: errorMessage
        }));
      })
    );
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.message) {
        return error.error.message;
      }
      if (error.error.error) {
        return error.error.error;
      }
    }
    return null;
  }
}
