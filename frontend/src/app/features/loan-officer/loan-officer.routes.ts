import { Routes } from '@angular/router';
import { LoanOfficerDashboardComponent } from './components/dashboard/dashboard.component';

export const loanOfficerRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: LoanOfficerDashboardComponent },
  // More routes will be implemented later
  // { path: 'applications', component: ApplicationQueueComponent },
  // { path: 'review/:id', component: ApplicationReviewComponent },
  // { path: 'reports', component: OfficerReportsComponent }
];
