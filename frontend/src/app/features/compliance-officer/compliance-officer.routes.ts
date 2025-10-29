import { Routes } from '@angular/router';

export const complianceOfficerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  // }
];