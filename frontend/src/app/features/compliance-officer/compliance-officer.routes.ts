import { Routes } from '@angular/router';
import { ComplianceDashboardComponent } from './components/dashboard/dashboard.component';

export const complianceOfficerRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: ComplianceDashboardComponent },
  // More routes will be implemented later
  // { path: 'investigations', component: InvestigationQueueComponent },
  // { path: 'investigate/:id', component: InvestigationDetailsComponent },
  // { path: 'reports', component: ComplianceReportsComponent }
];
