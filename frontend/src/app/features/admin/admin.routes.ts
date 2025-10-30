import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'officers/create',
    loadComponent: () => import('./components/create-officer/create-officer.component').then(m => m.CreateOfficerComponent)
  },
  {
    path: 'users/officers',
    loadComponent: () => import('./components/officer-management/officer-management.component').then(m => m.OfficerManagementComponent)
  },
  {
    path: 'users/applicants',
    loadComponent: () => import('./components/applicant-management/applicant-management.component').then(m => m.ApplicantManagementComponent)
  },
  {
    path: 'users/applicants/view',
    loadComponent: () => import('./components/applicant-details/applicant-details.component').then(m => m.ApplicantDetailsComponent)
  }
];