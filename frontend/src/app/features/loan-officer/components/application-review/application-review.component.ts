import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { LoanOfficerService, CompleteApplicationDetailsResponse } from '../../../../core/services/loan-officer.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-application-review',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-review.component.html',
  styleUrl: './application-review.component.css'
})
export class ApplicationReviewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loanOfficerService = inject(LoanOfficerService);
  private notificationService = inject(NotificationService);

  // Make Math available in template
  Math = Math;

  // Real backend data - Complete details for review
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  isLoading = signal(false);
  isProcessing = signal(false);
  
  // Active tab for review
  activeTab = signal<'personal' | 'financial' | 'documents' | 'timeline'>('personal');
  
  // Document preview
  selectedDocument = signal<any | null>(null);
  showDocumentPreview = signal(false);

  private routeSub?: Subscription;
  applicationId: string = '';

  // Computed properties for review
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
    return docs.filter((doc: any) => doc.verificationStatus === 'VERIFIED').length;
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
   * Load complete application details for review from REAL backend API
   */
  loadApplicationDetails(): void {
    this.isLoading.set(true);
    
    console.log('🔄 Loading complete application details for review, ID:', this.applicationId);
    console.log('🔄 API URL will be:', `${this.loanOfficerService['apiUrl']}/applications/${this.applicationId}/complete-details`);
    
    // ✅ REAL API CALL: GET /api/officer/applications/{id}/complete-details
    this.loanOfficerService.getCompleteApplicationDetails(this.applicationId).subscribe({
      next: (details: any) => {
        console.log('✅ Complete application details received:', details);
        
        // Transform your backend response to match our interface
        const transformedDetails: CompleteApplicationDetailsResponse = {
          application: {
            id: details.applicationInfo.id,
            applicantId: details.applicationInfo.id, // Using same ID
            applicantName: details.applicantIdentity.personalDetails.fullName,
            applicantEmail: details.applicantIdentity.contactInfo.email,
            applicantPhone: details.applicantIdentity.contactInfo.phone,
            loanType: details.applicationInfo.loanType,
            requestedAmount: details.applicationInfo.loanAmount,
            tenureMonths: details.applicationInfo.tenureMonths,
            purpose: details.applicationInfo.purpose,
            status: details.applicationInfo.status,
            priority: details.applicationInfo.priority,
            riskLevel: details.financialAssessment.riskAssessment.riskLevel,
            submittedAt: new Date(details.applicationInfo.submittedAt),
            assignedAt: new Date(details.applicationInfo.assignedAt),
            hasPersonalDetails: true,
            hasFinancialProfile: true,
            documentsCount: details.documents.length,
            verifiedDocumentsCount: details.documents.filter((doc: any) => doc.verificationStatus === 'VERIFIED').length,
            fraudCheckResultsCount: 0,
            existingLoans: details.financialAssessment.existingLoans.length > 0,
            existingEmi: details.financialAssessment.existingLoans.reduce((total: number, loan: any) => total + (loan.emi || 0), 0)
          },
          personalDetails: {
            firstName: details.applicantIdentity.personalDetails.firstName,
            lastName: details.applicantIdentity.personalDetails.lastName,
            middleName: details.applicantIdentity.personalDetails.middleName,
            dateOfBirth: details.applicantIdentity.personalDetails.dateOfBirth,
            gender: 'MALE', // Default since not in response
            maritalStatus: 'SINGLE', // Default since not in response
            fatherName: '', // Not in response
            motherName: '', // Not in response
            panNumber: details.applicantIdentity.personalDetails.panNumber,
            aadhaarNumber: details.applicantIdentity.personalDetails.aadhaarNumber,
            currentAddressLine1: details.applicantIdentity.personalDetails.addresses.currentAddress,
            currentCity: details.applicantIdentity.personalDetails.addresses.city,
            currentState: details.applicantIdentity.personalDetails.addresses.state,
            currentPincode: details.applicantIdentity.personalDetails.addresses.pincode,
            alternatePhoneNumber: details.applicantIdentity.contactInfo.alternatePhone
          },
          financialDetails: {
            employmentType: details.employmentDetails.employmentType,
            companyName: details.employmentDetails.companyName,
            jobTitle: details.employmentDetails.designation,
            monthlyIncome: details.employmentDetails.monthlyIncome,
            bankName: details.employmentDetails.bankDetails.bankName,
            accountNumber: details.employmentDetails.bankDetails.accountNumber,
            ifscCode: details.employmentDetails.bankDetails.ifscCode,
            accountType: details.employmentDetails.bankDetails.accountType
          },
          documents: details.documents.map((doc: any) => ({
            id: doc.documentId.toString(),
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSizeBytes,
            uploadedAt: new Date(doc.uploadDate),
            verificationStatus: doc.verificationStatus,
            verificationNotes: doc.verificationNotes,
            verifiedBy: doc.verifiedByName,
            verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined
          })),
          auditTrail: [
            {
              id: '1',
              action: 'APPLICATION_SUBMITTED',
              performedBy: details.applicantIdentity.personalDetails.fullName,
              timestamp: new Date(details.applicationInfo.submittedAt),
              details: 'Application submitted by applicant'
            },
            {
              id: '2',
              action: 'ASSIGNED_TO_OFFICER',
              performedBy: details.applicationInfo.assignedOfficerName,
              timestamp: new Date(details.applicationInfo.assignedAt),
              details: `Application assigned to ${details.applicationInfo.assignedOfficerName}`
            }
          ]
        };
        
        console.log('✅ Transformed data:', transformedDetails);
        this.applicationDetails.set(transformedDetails);
        this.isLoading.set(false);
        
        this.notificationService.success('Success', 'Application details loaded for review');
      },
      error: (error) => {
        console.error('❌ Error loading application details:', error);
        console.error('❌ Full error object:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        
        // Don't navigate away immediately, let user see the error
        this.notificationService.error('Error', `Failed to load application details: ${error.status} ${error.statusText || error.message || 'Unknown error'}`);
        this.isLoading.set(false);
        
        // Add fallback test data for debugging
        console.log('🔧 Adding fallback test data for debugging...');
        this.addTestDataForDebugging();
      }
    });
  }

  /**
   * Add test data for debugging when API fails
   */
  private addTestDataForDebugging(): void {
    const testData: CompleteApplicationDetailsResponse = {
      application: {
        id: this.applicationId,
        applicantId: 'test-applicant-id',
        applicantName: 'John Doe',
        applicantEmail: 'john.doe@example.com',
        applicantPhone: '+91-9876543210',
        loanType: 'PERSONAL_LOAN',
        requestedAmount: 500000,
        tenureMonths: 24,
        purpose: 'Home renovation',
        status: 'UNDER_REVIEW',
        priority: 'MEDIUM',
        riskLevel: 'LOW',
        submittedAt: new Date(),
        assignedAt: new Date(),
        hasPersonalDetails: true,
        hasFinancialProfile: true,
        documentsCount: 3,
        verifiedDocumentsCount: 1,
        fraudCheckResultsCount: 2,
        existingLoans: false,
        existingEmi: 0
      },
      personalDetails: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        fatherName: 'Robert Doe',
        motherName: 'Mary Doe',
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '1234-5678-9012',
        currentAddressLine1: '123 Main Street',
        currentCity: 'Mumbai',
        currentState: 'Maharashtra',
        currentPincode: '400001'
      },
      financialDetails: {
        employmentType: 'SALARIED',
        companyName: 'Tech Corp Ltd',
        jobTitle: 'Software Engineer',
        monthlyIncome: 75000,
        bankName: 'HDFC Bank',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        accountType: 'SAVINGS'
      },
      documents: [
        {
          id: 'doc1',
          documentType: 'AADHAAR',
          fileName: 'aadhaar.pdf',
          fileUrl: '/documents/aadhaar.pdf',
          fileSize: 1024000,
          uploadedAt: new Date(),
          verificationStatus: 'VERIFIED'
        },
        {
          id: 'doc2',
          documentType: 'PAN',
          fileName: 'pan.pdf',
          fileUrl: '/documents/pan.pdf',
          fileSize: 512000,
          uploadedAt: new Date(),
          verificationStatus: 'PENDING'
        },
        {
          id: 'doc3',
          documentType: 'SALARY_SLIP',
          fileName: 'salary.pdf',
          fileUrl: '/documents/salary.pdf',
          fileSize: 2048000,
          uploadedAt: new Date(),
          verificationStatus: 'PENDING'
        }
      ],
      auditTrail: [
        {
          id: 'audit1',
          action: 'APPLICATION_SUBMITTED',
          performedBy: 'John Doe',
          timestamp: new Date(Date.now() - 86400000),
          details: 'Application submitted by applicant'
        },
        {
          id: 'audit2',
          action: 'ASSIGNED_TO_OFFICER',
          performedBy: 'System',
          timestamp: new Date(Date.now() - 43200000),
          details: 'Application assigned to loan officer'
        }
      ]
    };
    
    console.log('🔧 Setting test data:', testData);
    this.applicationDetails.set(testData);
  }

  setActiveTab(tab: 'personal' | 'financial' | 'documents' | 'timeline'): void {
    this.activeTab.set(tab);
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

  getPriorityIcon(priority: string | undefined): string {
    if (!priority) return '⚪';
    const icons: { [key: string]: string } = {
      'HIGH': '🔴',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    return icons[priority] || '⚪';
  }
}
