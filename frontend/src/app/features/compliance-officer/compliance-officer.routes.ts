import { Routes } from '@angular/router';

export const complianceOfficerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/compliance-dashboard/compliance-dashboard.component').then(m => m.ComplianceDashboardComponent)
  },
  {
    path: 'applications',
    loadComponent: () => import('./components/applications-list/applications-list.component').then(m => m.ApplicationsListComponent)
  },
  {
    path: 'applications/review',
    loadComponent: () => import('./components/application-details/application-details.component').then(m => m.ApplicationDetailsComponent)
  },
  // Legacy routes for backward compatibility
  {
    path: 'flagged-applications',
    redirectTo: 'applications',
    pathMatch: 'full'
  },
  {
    path: 'under-review',
    redirectTo: 'applications',
    pathMatch: 'full'
  },
  {
    path: 'pending-documents',
    redirectTo: 'applications',
    pathMatch: 'full'
  }
];