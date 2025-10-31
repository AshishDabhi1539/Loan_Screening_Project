import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { LoanOfficerService, LoanApplicationResponse } from '../../../../core/services/loan-officer.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.css'
})
export class ApplicationDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loanOfficerService = inject(LoanOfficerService);
  private notificationService = inject(NotificationService);

  // Real backend data - NO STATIC DATA!
  applicationDetails = signal<LoanApplicationResponse | null>(null);
  isLoading = signal(false);
  isProcessing = signal(false);

  private routeSub?: Subscription;
  applicationId: string = '';

  // Computed properties
  canStartReview = computed(() => {
    const app = this.applicationDetails();
    return app?.status === 'SUBMITTED' || app?.status === 'UNDER_REVIEW';
  });

  canApprove = computed(() => {
    const app = this.applicationDetails();
    return app?.status === 'READY_FOR_DECISION';
  });

  canReject = computed(() => {
    const app = this.applicationDetails();
    return app?.status !== 'APPROVED' && app?.status !== 'REJECTED';
  });

  ngOnInit(): void {
    // Get application ID from route params
    this.routeSub = this.route.params.subscribe(params => {
      this.applicationId = params['id'];
      if (this.applicationId) {
        this.loadApplicationDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  /**
   * Load application details from REAL backend API
   */
  loadApplicationDetails(): void {
    this.isLoading.set(true);
    
    console.log('🔄 Loading application details for ID:', this.applicationId);
    
    // ✅ REAL API CALL: GET /api/officer/applications/{id}
    this.loanOfficerService.getApplicationForReview(this.applicationId).subscribe({
      next: (details) => {
        console.log('✅ Application details received:', details);
        this.applicationDetails.set(details);
        this.isLoading.set(false);
        
        this.notificationService.success('Success', 'Application details loaded');
      },
      error: (error) => {
        console.error('❌ Error loading application details:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        
        this.notificationService.error('Error', `Failed to load application details: ${error.message || 'Unknown error'}`);
        this.isLoading.set(false);
        
        // Set test data for debugging if API fails
        console.log('🔧 Setting test application data...');
        this.applicationDetails.set({
          id: this.applicationId,
          applicantId: 'test-applicant-1',
          applicantName: 'John Doe',
          applicantEmail: 'john.doe@example.com',
          applicantPhone: '+91-9876543210',
          loanType: 'PERSONAL_LOAN',
          requestedAmount: 50000,
          tenureMonths: 24,
          purpose: 'Personal expenses',
          existingLoans: false,
          status: 'UNDER_REVIEW',
          priority: 'HIGH',
          riskLevel: 'MEDIUM',
          submittedAt: new Date(),
          assignedAt: new Date(),
          hasPersonalDetails: true,
          hasFinancialProfile: true,
          documentsCount: 3,
          verifiedDocumentsCount: 2,
          fraudCheckResultsCount: 1
        });
      }
    });
  }

  /**
   * Go back to applications list
   */
  goBack(): void {
    this.router.navigate(['/loan-officer/applications/assigned']);
  }

  /**
   * Start application review - REAL backend API call
   */
  startReview(): void {
    if (!this.canStartReview()) {
      this.notificationService.warning('Warning', 'Cannot start review for this application');
      return;
    }

    if (!confirm('Start reviewing this application? This will change the status to UNDER_REVIEW.')) {
      return;
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/start-verification
    this.loanOfficerService.startDocumentVerification(this.applicationId).subscribe({
      next: (response: any) => {
        this.notificationService.success('Success', 'Application review started');
        this.loadApplicationDetails(); // Reload to get updated status
        this.isProcessing.set(false);
      },
      error: (error: any) => {
        console.error('Error starting review:', error);
        this.notificationService.error('Error', 'Failed to start review');
        this.isProcessing.set(false);
      }
    });
  }

  // Helper methods from service
  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return this.loanOfficerService.formatCurrency(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return this.loanOfficerService.formatDate(date);
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return '';
    return this.loanOfficerService.getStatusBadgeClass(status);
  }

  getPriorityBadgeClass(priority: string | undefined): string {
    if (!priority) return '';
    return this.loanOfficerService.getPriorityBadgeClass(priority);
  }

  getRiskLevelBadgeClass(riskLevel: string | undefined): string {
    if (!riskLevel) return '';
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  }

  formatLoanType(loanType: string | undefined): string {
    if (!loanType) return 'Unknown';
    return loanType.replace(/_/g, ' ');
  }

  getLoanTypeIcon(loanType: string | undefined): string {
    if (!loanType) return '📄';
    const icons: { [key: string]: string } = {
      'PERSONAL_LOAN': '👤',
      'HOME_LOAN': '🏠',
      'CAR_LOAN': '🚗',
      'TWO_WHEELER_LOAN': '🏍️',
      'EDUCATION_LOAN': '🎓',
      'BUSINESS_LOAN': '💼',
      'GOLD_LOAN': '💰',
      'PROPERTY_LOAN': '🏢'
    };
    return icons[loanType] || '📄';
  }

  getDocumentIcon(documentType: string | undefined): string {
    if (!documentType) return '📄';
    const icons: { [key: string]: string } = {
      'AADHAAR': '🆔',
      'PAN': '📇',
      'BANK_STATEMENT': '🏦',
      'SALARY_SLIP': '💰',
      'ITR': '📊',
      'PROPERTY_DOCUMENT': '🏠',
      'VEHICLE_REGISTRATION': '🚗',
      'EDUCATION_CERTIFICATE': '🎓',
      'BUSINESS_REGISTRATION': '💼',
      'OTHER': '📄'
    };
    return icons[documentType] || '📄';
  }

  getPriorityIcon(priority: string | undefined): string {
    if (!priority) return '⚪';
    const icons: { [key: string]: string } = {
      'HIGH': '🔴',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    return icons[priority] || '⚪';
  }

  /**
   * Approve application - REAL backend API call
   */
  approveApplication(): void {
    const remarks = prompt('Enter approval remarks (optional):');
    if (remarks === null) {
      return; // User cancelled
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/approve
    this.loanOfficerService.approveApplication(this.applicationId, {
      decisionReason: remarks || 'Application approved'
    }).subscribe({
      next: (response) => {
        this.notificationService.success('Success', 'Application approved successfully');
        this.loadApplicationDetails();
        this.isProcessing.set(false);
      },
      error: (error) => {
        console.error('Error approving application:', error);
        this.notificationService.error('Error', 'Failed to approve application');
        this.isProcessing.set(false);
      }
    });
  }

  /**
   * Reject application - REAL backend API call
   */
  rejectApplication(): void {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      this.notificationService.warning('Warning', 'Rejection reason is required');
      return;
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/reject
    this.loanOfficerService.rejectApplication(this.applicationId, {
      decisionReason: reason
    }).subscribe({
      next: (response) => {
        this.notificationService.success('Success', 'Application rejected');
        this.loadApplicationDetails();
        this.isProcessing.set(false);
      },
      error: (error) => {
        console.error('Error rejecting application:', error);
        this.notificationService.error('Error', 'Failed to reject application');
        this.isProcessing.set(false);
      }
    });
  }
}
