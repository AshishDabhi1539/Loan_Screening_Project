import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  
  // Authentication routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  
  // Applicant routes (protected)
  {
    path: 'applicant',
    loadChildren: () => import('./features/applicant/applicant.routes').then(m => m.applicantRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['APPLICANT'] }
  },
  
  // Loan Officer routes (protected)
  {
    path: 'loan-officer',
    loadChildren: () => import('./features/loan-officer/loan-officer.routes').then(m => m.loanOfficerRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER'] }
  },
  
  // Compliance Officer routes (protected)
  {
    path: 'compliance-officer',
    loadChildren: () => import('./features/compliance-officer/compliance-officer.routes').then(m => m.complianceOfficerRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER'] }
  },
  
  // Admin routes (protected)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Notifications route (protected - all authenticated users)
  {
    path: 'notifications',
    loadComponent: () => import('./shared/components/notification-list/notification-list.component').then(m => m.NotificationListComponent),
    canActivate: [AuthGuard]
  },
  
  // Wildcard route
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
