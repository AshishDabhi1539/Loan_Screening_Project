import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { 
  ApplicantDashboard, 
  LoanApplication, 
  Notification,
  LoanType,
  ApplicationStatus,
  Priority,
  RiskLevel,
  VerificationStatus,
  NotificationType
} from '../../../../core/models/loan-application.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser = this.authService.currentUser;
  dashboardData = signal<ApplicantDashboard>({
    totalApplications: 0,
    activeApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    recentApplications: [],
    pendingDocuments: 0,
    notifications: []
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Mock data for demonstration - will be replaced with actual API calls
    const mockData: ApplicantDashboard = {
      totalApplications: 3,
      activeApplications: 2,
      approvedApplications: 1,
      rejectedApplications: 0,
      pendingDocuments: 2,
      recentApplications: [
        {
          id: 'app-001-demo',
          applicantId: 'user-001',
          applicantName: 'John Doe',
          loanType: LoanType.PERSONAL_LOAN,
          requestedAmount: 500000,
          purpose: 'Home renovation',
          status: ApplicationStatus.UNDER_REVIEW,
          priority: Priority.MEDIUM,
          riskLevel: RiskLevel.LOW,
          submittedAt: new Date('2024-10-20'),
          lastUpdatedAt: new Date('2024-10-22'),
          documentsCount: 4,
          fraudCheckResultsCount: 1,
          externalVerificationStatus: VerificationStatus.COMPLETED,
          createdAt: new Date('2024-10-20'),
          updatedAt: new Date('2024-10-22')
        },
        {
          id: 'app-002-demo',
          applicantId: 'user-001',
          applicantName: 'John Doe',
          loanType: LoanType.HOME_LOAN,
          requestedAmount: 2500000,
          purpose: 'Property purchase',
          status: ApplicationStatus.DOCUMENTS_REQUIRED,
          priority: Priority.HIGH,
          riskLevel: RiskLevel.MEDIUM,
          submittedAt: new Date('2024-10-18'),
          lastUpdatedAt: new Date('2024-10-21'),
          documentsCount: 2,
          fraudCheckResultsCount: 0,
          externalVerificationStatus: VerificationStatus.PENDING,
          createdAt: new Date('2024-10-18'),
          updatedAt: new Date('2024-10-21')
        }
      ],
      notifications: [
        {
          id: 'notif-001',
          type: NotificationType.IN_APP,
          title: 'Document Required',
          message: 'Please upload your salary certificate for application #app-002-demo',
          isRead: false,
          createdAt: new Date('2024-10-22T10:30:00'),
          relatedEntityType: 'LoanApplication',
          relatedEntityId: 'app-002-demo'
        },
        {
          id: 'notif-002',
          type: NotificationType.IN_APP,
          title: 'Application Under Review',
          message: 'Your personal loan application is now under review by our team',
          isRead: false,
          createdAt: new Date('2024-10-21T14:15:00'),
          relatedEntityType: 'LoanApplication',
          relatedEntityId: 'app-001-demo'
        }
      ]
    };

    this.dashboardData.set(mockData);
  }

  startNewApplication(): void {
    // Navigate to loan application form
    this.router.navigate(['/applicant/loan-application/new']);
  }

  viewProfile(): void {
    // Navigate to profile page
    this.router.navigate(['/applicant/profile']);
  }

  uploadDocuments(): void {
    // Navigate to documents page
    this.router.navigate(['/applicant/documents']);
  }

  trackApplications(): void {
    // Navigate to applications list
    this.router.navigate(['/applicant/applications']);
  }

  completeProfile(): void {
    // Navigate to profile completion
    this.router.navigate(['/applicant/profile/complete']);
  }

  logout(): void {
    this.authService.logout();
  }
}
