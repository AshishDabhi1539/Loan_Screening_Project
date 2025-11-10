import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading for certain endpoints
    if (this.shouldSkipLoading(req.url)) {
      return next.handle(req);
    }

    // Increment active requests
    this.activeRequests++;
    this.updateLoadingState();

    return next.handle(req).pipe(
      finalize(() => {
        // Decrement active requests
        this.activeRequests--;
        this.updateLoadingState();
      })
    );
  }

  private shouldSkipLoading(url: string): boolean {
    const skipEndpoints = [
      '/auth/logout',
      '/health',
      '/ping'
    ];
    
    return skipEndpoints.some(endpoint => url.includes(endpoint));
  }

  private updateLoadingState(): void {
    // Emit loading state to a service (we'll create this later)
    // For now, we can use a simple approach
    const isLoading = this.activeRequests > 0;
    
    // You can dispatch this to a loading service
    // this.loadingService.setLoading(isLoading);
    
    // For debugging
    if (isLoading !== this.getPreviousLoadingState()) {
      console.log('Loading state changed:', isLoading);
      this.setPreviousLoadingState(isLoading);
    }
  }

  private getPreviousLoadingState(): boolean {
    return (window as any).__loadingState || false;
  }

  private setPreviousLoadingState(state: boolean): void {
    (window as any).__loadingState = state;
  }
}
