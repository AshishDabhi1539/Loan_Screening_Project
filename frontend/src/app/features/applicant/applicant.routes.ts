import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const applicantRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  // More routes will be implemented later
  // { path: 'profile', component: ProfileComponent },
  // { path: 'loan-application', component: LoanApplicationComponent },
  // { path: 'documents', component: DocumentsComponent }
];
