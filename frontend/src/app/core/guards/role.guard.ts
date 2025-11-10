import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const currentUser = this.authService.currentUser();
    
    if (!currentUser) {
      return this.router.createUrlTree(['/auth/login']);
    }

    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.includes(currentUser.role);
    
    if (hasRequiredRole) {
      return true;
    }

    // Redirect based on user's actual role
    return this.redirectToUserDashboard(currentUser);
  }

  private redirectToUserDashboard(user: User): UrlTree {
    switch (user.role) {
      case 'APPLICANT':
        return this.router.createUrlTree(['/applicant/dashboard']);
      case 'LOAN_OFFICER':
      case 'SENIOR_LOAN_OFFICER':
        return this.router.createUrlTree(['/loan-officer/dashboard']);
      case 'COMPLIANCE_OFFICER':
      case 'SENIOR_COMPLIANCE_OFFICER':
        return this.router.createUrlTree(['/compliance-officer/dashboard']);
      case 'ADMIN':
        return this.router.createUrlTree(['/admin/dashboard']);
      default:
        return this.router.createUrlTree(['/auth/login']);
    }
  }
}