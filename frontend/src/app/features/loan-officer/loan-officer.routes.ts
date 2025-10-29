import { Routes } from '@angular/router';

export const loanOfficerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
//   {
//     path: 'dashboard',
//     loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
//   }
];