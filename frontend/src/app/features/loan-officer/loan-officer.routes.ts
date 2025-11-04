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
    path: 'applications',
    children: [
      {
        path: '',
        redirectTo: 'assigned',
        pathMatch: 'full'
      },
      {
        path: 'assigned',
        loadComponent: () => import('./components/applications-list/applications-list.component').then(m => m.ApplicationsListComponent)
      },
      {
        path: 'pending-documents',
        loadComponent: () => import('./components/applications-list/applications-list.component').then(m => m.ApplicationsListComponent),
        data: { filter: 'pending-documents' }
      },
      {
        path: 'ready-for-decision',
        loadComponent: () => import('./components/applications-list/applications-list.component').then(m => m.ApplicationsListComponent),
        data: { filter: 'ready-for-decision' }
      },
      {
        path: 'completed',
        loadComponent: () => import('./components/applications-list/applications-list.component').then(m => m.ApplicationsListComponent),
        data: { filter: 'completed' }
      },
      {
        path: 'post-compliance',
        loadComponent: () => import('./components/post-compliance-list/post-compliance-list.component').then(m => m.PostComplianceListComponent)
      }
    ]
  },
  {
    path: 'application/:id',
    children: [
      {
        path: '',
        redirectTo: 'details',
        pathMatch: 'full'
      },
      {
        path: 'details',
        loadComponent: () => import('./components/application-details/application-details.component').then(m => m.ApplicationDetailsComponent)
      },
      {
        path: 'review',
        loadComponent: () => import('./components/application-review/application-review.component').then(m => m.ApplicationReviewComponent)
      },
      {
        path: 'document-verification',
        loadComponent: () => import('./components/document-verification/document-verification.component').then(m => m.DocumentVerificationComponent)
      },
      {
        path: 'external-verification',
        loadComponent: () => import('./components/external-verification/external-verification.component').then(m => m.ExternalVerificationComponent)
      },
      {
        path: 'decision',
        loadComponent: () => import('./components/decision/decision.component').then(m => m.DecisionComponent)
      },
      {
        path: 'approval-summary',
        loadComponent: () => import('./components/approval-summary/approval-summary.component').then(m => m.ApprovalSummaryComponent)
      }
    ]
  }
];
