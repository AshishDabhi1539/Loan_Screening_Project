import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { LoanOfficerService, CompleteApplicationDetailsResponse } from '../../../../core/services/loan-officer.service';
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
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  isLoading = signal(false);
  isProcessing = signal(false);
  
  // Active tab
  activeTab = signal<'personal' | 'financial' | 'documents' | 'timeline'>('personal');
  
  // Document preview
  selectedDocument = signal<any | null>(null);
  showDocumentPreview = signal(false);

  private routeSub?: Subscription;
  applicationId: string = '';

  // Computed properties
  hasPersonalDetails = computed(() => {
    const details = this.applicationDetails();
    return details?.personalDetails !== null && details?.personalDetails !== undefined;
  });

  hasFinancialProfile = computed(() => {
    const details = this.applicationDetails();
    return details?.financialDetails !== null && details?.financialDetails !== undefined;
  });

  documentsCount = computed(() => {
    return this.applicationDetails()?.documents?.length || 0;
  });

  verifiedDocumentsCount = computed(() => {
    const docs = this.applicationDetails()?.documents || [];
    return docs.filter(doc => doc.verificationStatus === 'VERIFIED').length;
  });

  pendingDocumentsCount = computed(() => {
    return this.documentsCount() - this.verifiedDocumentsCount();
  });

  canStartReview = computed(() => {
    const app = this.applicationDetails();
    return app?.application?.status === 'SUBMITTED' || app?.application?.status === 'UNDER_REVIEW';
  });

  canVerifyDocuments = computed(() => {
    const app = this.applicationDetails();
    return app?.application?.status === 'UNDER_REVIEW' || app?.application?.status === 'DOCUMENT_VERIFICATION';
  });

  canApprove = computed(() => {
    const app = this.applicationDetails();
    return app?.application?.status === 'READY_FOR_DECISION' && this.verifiedDocumentsCount() === this.documentsCount();
  });

  canReject = computed(() => {
    const app = this.applicationDetails();
    return app?.application?.status !== 'APPROVED' && app?.application?.status !== 'REJECTED';
  });

  canFlagForCompliance = computed(() => {
    const app = this.applicationDetails();
    return app?.application?.status !== 'APPROVED' && app?.application?.status !== 'REJECTED' && app?.application?.status !== 'FLAGGED_FOR_COMPLIANCE';
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
   * Load complete application details from REAL backend API
   */
  loadApplicationDetails(): void {
    this.isLoading.set(true);
    
    // ✅ REAL API CALL: GET /api/officer/applications/{id}/complete-details
    this.loanOfficerService.getCompleteApplicationDetails(this.applicationId).subscribe({
      next: (details) => {
        this.applicationDetails.set(details);
        this.isLoading.set(false);
        console.log('Loaded complete application details from backend:', details);
      },
      error: (error) => {
        console.error('Error loading application details:', error);
        this.notificationService.error('Error', 'Failed to load application details');
        this.isLoading.set(false);
        this.router.navigate(['/loan-officer/applications']);
      }
    });
  }

  setActiveTab(tab: 'personal' | 'financial' | 'documents' | 'timeline'): void {
    this.activeTab.set(tab);
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

  /**
   * View document - opens document preview
   */
  viewDocument(document: any): void {
    this.selectedDocument.set(document);
    this.showDocumentPreview.set(true);
  }

  closeDocumentPreview(): void {
    this.showDocumentPreview.set(false);
    this.selectedDocument.set(null);
  }

  /**
   * Download document from backend
   */
  downloadDocument(document: any): void {
    // TODO: Implement document download from backend
    this.notificationService.info('Info', 'Document download will be implemented');
  }

  /**
   * Verify document - REAL backend API call
   */
  verifyDocument(documentId: string): void {
    if (!confirm('Mark this document as verified?')) {
      return;
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/verify-documents
    this.loanOfficerService.verifyDocuments(this.applicationId, {
      verifiedDocuments: [documentId],
      rejectedDocuments: [],
      verificationNotes: 'Document verified by loan officer'
    }).subscribe({
      next: (response: any) => {
        this.notificationService.success('Success', 'Document verified');
        this.loadApplicationDetails(); // Reload to get updated document status
        this.isProcessing.set(false);
      },
      error: (error: any) => {
        console.error('Error verifying document:', error);
        this.notificationService.error('Error', 'Failed to verify document');
        this.isProcessing.set(false);
      }
    });
  }

  /**
   * Reject document - REAL backend API call
   */
  rejectDocument(documentId: string): void {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      return;
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/verify-documents
    this.loanOfficerService.verifyDocuments(this.applicationId, {
      verifiedDocuments: [],
      rejectedDocuments: [{ documentType: documentId, rejectionReason: reason }],
      verificationNotes: reason
    }).subscribe({
      next: (response: any) => {
        this.notificationService.success('Success', 'Document rejected');
        this.loadApplicationDetails();
        this.isProcessing.set(false);
      },
      error: (error: any) => {
        console.error('Error rejecting document:', error);
        this.notificationService.error('Error', 'Failed to reject document');
        this.isProcessing.set(false);
      }
    });
  }

  /**
   * Request external verification - REAL backend API call
   */
  requestExternalVerification(): void {
    if (!confirm('Request external verification for this application?')) {
      return;
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/trigger-external-verification
    this.loanOfficerService.triggerExternalVerification(this.applicationId).subscribe({
      next: (response: any) => {
        this.notificationService.success('Success', 'External verification requested');
        this.loadApplicationDetails();
        this.isProcessing.set(false);
      },
      error: (error: any) => {
        console.error('Error requesting external verification:', error);
        this.notificationService.error('Error', 'Failed to request external verification');
        this.isProcessing.set(false);
      }
    });
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

  /**
   * Flag for compliance - REAL backend API call
   */
  flagForCompliance(): void {
    const reason = prompt('Enter reason for flagging:');
    if (!reason) {
      this.notificationService.warning('Warning', 'Flag reason is required');
      return;
    }

    const priority = prompt('Enter priority (HIGH/MEDIUM/LOW):')?.toUpperCase();
    if (!priority || !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
      this.notificationService.warning('Warning', 'Valid priority is required');
      return;
    }

    this.isProcessing.set(true);
    
    // ✅ REAL API CALL: POST /api/officer/applications/{id}/flag-for-compliance
    this.loanOfficerService.flagForCompliance(this.applicationId, {
      flagReason: reason,
      suspiciousActivities: [reason],
      priority: priority as 'HIGH' | 'MEDIUM' | 'LOW',
      additionalEvidence: `Flagged by loan officer: ${reason}`
    }).subscribe({
      next: (response) => {
        this.notificationService.success('Success', 'Application flagged for compliance review');
        this.loadApplicationDetails();
        this.isProcessing.set(false);
      },
      error: (error) => {
        console.error('Error flagging application:', error);
        this.notificationService.error('Error', 'Failed to flag application');
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
}
