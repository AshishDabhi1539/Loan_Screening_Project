import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';
import { LandingComponent } from './features/landing/landing.component';

export const routes: Routes = [
  // Landing page
  { 
    path: '', 
    component: LandingComponent 
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
    data: { roles: [UserRole.APPLICANT] }
  },

  // Loan Officer routes (protected)
  {
    path: 'loan-officer',
    loadChildren: () => import('./features/loan-officer/loan-officer.routes').then(m => m.loanOfficerRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.LOAN_OFFICER, UserRole.SENIOR_LOAN_OFFICER] }
  },

  // Compliance Officer routes (protected)
  {
    path: 'compliance-officer',
    loadChildren: () => import('./features/compliance-officer/compliance-officer.routes').then(m => m.complianceOfficerRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.COMPLIANCE_OFFICER, UserRole.SENIOR_COMPLIANCE_OFFICER] }
  },

  // Admin routes (protected)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] }
  },

  // Wildcard route - must be last
  { 
    path: '**', 
    redirectTo: '' 
  }
];
