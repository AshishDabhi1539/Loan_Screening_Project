import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/dashboard/dashboard.component';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  // More routes will be implemented later
  // { path: 'users', component: UserManagementComponent },
  // { path: 'officers', component: OfficerManagementComponent },
  // { path: 'settings', component: SystemSettingsComponent },
  // { path: 'audit', component: AuditLogsComponent }
];
