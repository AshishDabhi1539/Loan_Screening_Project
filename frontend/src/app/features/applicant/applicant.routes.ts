import { Routes } from '@angular/router';

export const applicantRoutes: Routes = [
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
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'personal-details',
    loadComponent: () => import('./components/personal-details/personal-details.component').then(m => m.PersonalDetailsComponent)
  },
  {
    path: 'apply-loan',
    loadComponent: () => import('./components/loan-application/loan-application.component').then(m => m.LoanApplicationComponent)
  },
  {
    path: 'employment-details',
    loadComponent: () => import('./components/employment-details/employment-details.component').then(m => m.EmploymentDetailsComponent)
  },
  {
    path: 'document-upload',
    loadComponent: () => import('./components/document-upload/document-upload.component').then(m => m.DocumentUploadComponent)
  },
  {
    path: 'application-summary',
    loadComponent: () => import('./components/application-summary/application-summary.component').then(m => m.ApplicationSummaryComponent)
  },
//   {
//     path: 'applications',
//     loadComponent: () => import('./components/my-applications/my-applications.component').then(m => m.MyApplicationsComponent)
//   },
//   {
//     path: 'profile',
//     loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
//   }
];