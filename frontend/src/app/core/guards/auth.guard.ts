import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // If still initializing, wait for it to complete
    if (this.authService.isInitializing()) {
      return new Promise((resolve) => {
        const checkInit = () => {
          if (!this.authService.isInitializing()) {
            // Initialization complete, check authentication
            if (this.authService.isAuthenticated()) {
              const currentUser = this.authService.currentUser();
              if (currentUser?.status === 'PENDING_VERIFICATION') {
                resolve(this.router.createUrlTree(['/auth/verify-email']));
              } else {
                resolve(true);
              }
            } else {
              resolve(this.router.createUrlTree(['/auth/login']));
            }
          } else {
            // Still initializing, check again in 50ms
            setTimeout(checkInit, 50);
          }
        };
        checkInit();
      });
    }

    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.currentUser();
      
      // Check if user needs email verification
      if (currentUser?.status === 'PENDING_VERIFICATION') {
        return this.router.createUrlTree(['/auth/verify-email']);
      }
      
      return true;
    }
    
    // Redirect to login if not authenticated
    return this.router.createUrlTree(['/auth/login']);
  }
}