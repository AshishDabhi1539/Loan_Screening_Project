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
//   {
//     path: 'apply',
//     loadComponent: () => import('./components/loan-application/loan-application.component').then(m => m.LoanApplicationComponent)
//   },
//   {
//     path: 'applications',
//     loadComponent: () => import('./components/my-applications/my-applications.component').then(m => m.MyApplicationsComponent)
//   },
//   {
//     path: 'profile',
//     loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
//   }
];