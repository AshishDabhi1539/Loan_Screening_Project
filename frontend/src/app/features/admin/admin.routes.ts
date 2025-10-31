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
    path: 'users/officers/view',
    loadComponent: () => import('./components/officer-details/officer-details.component').then(m => m.OfficerDetailsComponent)
  },
  {
    path: 'officers/applications',
    loadComponent: () => import('./components/officer-applications/officer-applications.component').then(m => m.OfficerApplicationsComponent)
  },
  {
    path: 'users/applicants',
    loadComponent: () => import('./components/applicant-management/applicant-management.component').then(m => m.ApplicantManagementComponent)
  },
  {
    path: 'users/applicants/view',
    loadComponent: () => import('./components/applicant-details/applicant-details.component').then(m => m.ApplicantDetailsComponent)
  },
  {
    path: 'applicants/applications',
    loadComponent: () => import('./components/applicant-applications/applicant-applications.component').then(m => m.ApplicantApplicationsComponent)
  }
];