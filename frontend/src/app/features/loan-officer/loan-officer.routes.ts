import { Routes } from '@angular/router';

export const loanOfficerRoutes: Routes = [
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
    path: 'applications/assigned',
    loadComponent: () => import('./components/loan-applications/loan-applications.component').then(m => m.LoanApplicationsComponent)
  },
  {
    path: 'applications/:id/details',
    loadComponent: () => import('./components/application-details/application-details.component').then(m => m.ApplicationDetailsComponent)
  },
  {
    path: 'applications/:id/review',
    loadComponent: () => import('./components/application-review/application-review.component').then(m => m.ApplicationReviewComponent)
  }
];