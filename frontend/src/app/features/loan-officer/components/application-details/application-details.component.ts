import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, CompleteApplicationDetailsResponse, DocumentInfo } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-loan-officer-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.css'
})
export class ApplicationDetailsComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  isLoading = signal(false);
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  auditTrail = signal<any[]>([]);
  isLoadingAudit = signal(false);
  
  // Active tab
  activeTab = signal<'overview' | 'personal' | 'financial' | 'documents' | 'external' | 'audit'>('overview');

  ngOnInit(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (applicationId) {
      this.loadApplicationDetails(applicationId);
      
      // Subscribe to route params to reload data when navigating back
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.loadApplicationDetails(params['id']);
        }
      });
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Load complete application details
   */
  private loadApplicationDetails(applicationId: string): void {
    this.isLoading.set(true);
    this.loanOfficerService.getCompleteApplicationDetails(applicationId).subscribe({
      next: (details) => {
        this.applicationDetails.set(details);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading application details:', error);
        this.notificationService.error(
          'Error Loading Application',
          'Failed to load application details. Please try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: 'overview' | 'personal' | 'financial' | 'documents' | 'external' | 'audit'): void {
    this.activeTab.set(tab);
    
    // Load audit trail when audit tab is clicked
    if (tab === 'audit' && this.auditTrail().length === 0) {
      this.loadAuditTrail();
    }
  }

  /**
   * Load audit trail
   */
  private loadAuditTrail(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (!appId) return;

    this.isLoadingAudit.set(true);
    this.loanOfficerService.getAuditTrail(appId).subscribe({
      next: (trail) => {
        this.auditTrail.set(trail);
        this.isLoadingAudit.set(false);
      },
      error: (error) => {
        console.error('Error loading audit trail:', error);
        this.notificationService.error('Error', 'Failed to load audit trail');
        this.isLoadingAudit.set(false);
      }
    });
  }

  /**
   * Navigate to document verification
   */
  startDocumentVerification(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'document-verification']);
    }
  }

  /**
   * Trigger external verification (fraud check)
   */
  triggerExternalVerification(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (!appId) return;

    this.loanOfficerService.triggerExternalVerification(appId).subscribe({
      next: () => {
        this.notificationService.success(
          'External Verification Triggered',
          'Fraud check and credit scoring has been initiated. The application will move to Ready for Decision once complete.'
        );
        // Reload application details to show updated status
        this.loadApplicationDetails(appId);
      },
      error: (error) => {
        console.error('Error triggering external verification:', error);
        this.notificationService.error(
          'Verification Failed',
          error.error?.message || 'Failed to trigger external verification.'
        );
      }
    });
  }

  /**
   * Navigate to external verification
   */
  startExternalVerification(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'external-verification']);
    }
  }

  /**
   * Navigate to decision
   */
  makeDecision(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'decision']);
    }
  }

  /**
   * Navigate to review workflow
   */
  startReview(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'review']);
    }
  }

  /**
   * Navigate back to applications list
   */
  viewApplicationDetails(): void {
    this.router.navigate(['/loan-officer/applications/assigned']);
  }

  /**
   * Check if can proceed to next step
   */
  canProceedToVerification = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    return app && ['SUBMITTED', 'UNDER_REVIEW'].includes(app.status);
  });

  canProceedToDecision = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    return app && app.status === 'READY_FOR_DECISION';
  });

  /**
   * Get applicant name from contact info
   */
  getApplicantName = computed(() => {
    const identity = this.applicationDetails()?.applicantIdentity;
    if (identity?.personalDetails) {
      return identity.personalDetails.fullName || 
             `${identity.personalDetails.firstName} ${identity.personalDetails.lastName}`.trim();
    }
    return 'N/A';
  });

  /**
   * Get applicant email
   */
  getApplicantEmail = computed(() => {
    return this.applicationDetails()?.applicantIdentity?.contactInfo?.email || 'N/A';
  });

  /**
   * Get applicant phone
   */
  getApplicantPhone = computed(() => {
    return this.applicationDetails()?.applicantIdentity?.contactInfo?.phone || 'N/A';
  });

  /**
   * Get requested amount from financial assessment
   */
  getRequestedAmount = computed(() => {
    return this.applicationDetails()?.financialAssessment?.loanDetails?.requestedAmount || 
           this.applicationDetails()?.applicationInfo?.loanAmount || 0;
  });

  /**
   * Get risk level from financial assessment
   */
  getRiskLevel = computed(() => {
    return this.applicationDetails()?.financialAssessment?.riskAssessment?.riskLevel || 'UNKNOWN';
  });

  /**
   * Check if has existing loans
   */
  hasExistingLoans = computed(() => {
    const loans = this.applicationDetails()?.financialAssessment?.existingLoans || [];
    return loans.length > 0;
  });

  /**
   * Get total existing EMI
   */
  getTotalExistingEmi = computed(() => {
    const loans = this.applicationDetails()?.financialAssessment?.existingLoans || [];
    return loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  });

  /**
   * Get personal details for display
   */
  getPersonalDetails = computed(() => {
    const identity = this.applicationDetails()?.applicantIdentity;
    if (!identity?.personalDetails) return null;
    return identity.personalDetails;
  });

  /**
   * Get contact info
   */
  getContactInfo = computed(() => {
    return this.applicationDetails()?.applicantIdentity?.contactInfo;
  });

  /**
   * Get financial details for display
   */
  getFinancialDetails = computed(() => {
    const employment = this.applicationDetails()?.employmentDetails;
    const financial = this.applicationDetails()?.financialAssessment;
    if (!employment && !financial) return null;

    return {
      employmentType: employment?.employmentType || 'N/A',
      companyName: employment?.companyName || 'N/A',
      jobTitle: employment?.designation || 'N/A',
      designation: employment?.designation || 'N/A',
      monthlyIncome: employment?.monthlyIncome || 0,
      annualIncome: employment?.annualIncome || 0,
      additionalIncome: 0, // Not in backend structure
      existingEmi: 0, // Calculate from existing loans if needed
      otherObligations: 0, // Not in backend structure
      foir: financial?.calculatedRatios?.emiToIncomeRatio || 0,
      creditCardOutstanding: 0, // Not in backend structure
      employmentStartDate: null, // Not in backend structure
      companyAddress: employment?.companyContact?.companyAddress || '',
      bankName: employment?.bankDetails?.bankName || 'N/A',
      accountNumber: employment?.bankDetails?.accountNumber || 'N/A',
      ifscCode: employment?.bankDetails?.ifscCode || 'N/A',
      accountType: employment?.bankDetails?.accountType || 'N/A',
      branchName: employment?.bankDetails?.branchName || 'N/A',
      requestedAmount: financial?.loanDetails?.requestedAmount || 0,
      estimatedEmi: financial?.loanDetails?.estimatedEmi || 0,
      riskLevel: financial?.riskAssessment?.riskLevel || 'UNKNOWN',
      riskScore: financial?.riskAssessment?.riskScore || 0,
      fraudScore: financial?.riskAssessment?.fraudScore || 0,
      existingLoans: financial?.existingLoans || []
    };
  });

  /**
   * Get external verification info (from financialAssessment riskAssessment for now)
   */
  getExternalVerification = computed(() => {
    const financial = this.applicationDetails()?.financialAssessment;
    const summary = this.applicationDetails()?.verificationSummary;
    
    if (!financial?.riskAssessment && !summary) return null;

    return {
      creditScore: null,
      riskScore: financial?.riskAssessment?.riskLevel || 'UNKNOWN',
      riskScoreNumeric: financial?.riskAssessment?.riskScore || 0,
      fraudScore: financial?.riskAssessment?.fraudScore || 0,
      riskFactors: financial?.riskAssessment?.riskFactors?.join(', ') || 'No risk factors identified',
      creditScoreReason: undefined,
      redAlertFlag: (financial?.riskAssessment?.fraudScore || 0) > 70,
      recommendedAction: financial?.riskAssessment?.overallAssessment || summary?.nextAction || 'Review required',
      verifiedAt: new Date(),
      dataFound: summary?.externalVerificationComplete || false
    };
  });

  /**
   * Get smart action button based on application status
   */
  getSmartActionButton = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    if (!app) return null;

    switch (app.status) {
      case 'SUBMITTED':
        return {
          text: 'Start Verification Process',
          action: 'start-verification',
          color: 'bg-blue-600 hover:bg-blue-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          method: () => this.startDocumentVerification()
        };
      case 'DOCUMENT_VERIFICATION':
        return {
          text: 'Resume Document Verification',
          action: 'resume-verification',
          color: 'bg-purple-600 hover:bg-purple-700',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          method: () => this.startDocumentVerification()
        };
      case 'PENDING_EXTERNAL_VERIFICATION':
        return {
          text: 'Trigger External Verification',
          action: 'trigger-external',
          color: 'bg-indigo-600 hover:bg-indigo-700',
          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
          method: () => this.triggerExternalVerification()
        };
      case 'EXTERNAL_VERIFICATION':
        return {
          text: 'Continue External Verification',
          action: 'continue-external',
          color: 'bg-indigo-600 hover:bg-indigo-700',
          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
          method: () => this.startExternalVerification()
        };
      case 'UNDER_REVIEW':
        return {
          text: 'Continue Review Process',
          action: 'continue-review',
          color: 'bg-orange-600 hover:bg-orange-700',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
          method: () => this.startReview()
        };
      case 'READY_FOR_DECISION':
        return {
          text: 'Make Final Decision',
          action: 'make-decision',
          color: 'bg-green-600 hover:bg-green-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          method: () => this.makeDecision()
        };
      case 'APPROVED':
        return {
          text: 'View Approval Details',
          action: 'view-approval',
          color: 'bg-green-600 hover:bg-green-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          method: () => this.makeDecision()
        };
      case 'REJECTED':
        return {
          text: 'View Rejection Details',
          action: 'view-rejection',
          color: 'bg-red-600 hover:bg-red-700',
          icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
          method: () => this.makeDecision()
        };
      default:
        return null;
    }
  });

  /**
   * Get progress percentage
   */
  getProgressPercentage = computed(() => {
    const steps = this.getProgressSteps();
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  });

  /**
   * Get completed steps count
   */
  getCompletedStepsCount = computed(() => {
    return this.getProgressSteps().filter(s => s.status === 'completed').length;
  });

  /**
   * Get progress steps for the application
   */
  getProgressSteps = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    if (!app) return [];

    const steps = [
      { name: 'Submitted', status: 'completed', current: false },
      { name: 'Document Verification', status: 'pending', current: false },
      { name: 'External Verification', status: 'pending', current: false },
      { name: 'Review Process', status: 'pending', current: false },
      { name: 'Final Decision', status: 'pending', current: false }
    ];

    switch (app.status) {
      case 'SUBMITTED':
        steps[1].current = true;
        break;
      case 'UNDER_REVIEW':
        steps[1].status = 'current';
        steps[1].current = true;
        break;
      case 'DOCUMENT_VERIFICATION':
        steps[1].status = 'current';
        steps[1].current = true;
        break;
      case 'DOCUMENT_INCOMPLETE':
        // Documents need resubmission - show as current step with warning
        steps[1].status = 'current';
        steps[1].current = true;
        steps[1].name = 'Document Verification (Incomplete)';
        break;
      case 'PENDING_EXTERNAL_VERIFICATION':
        steps[1].status = 'completed';
        steps[2].status = 'current';
        steps[2].current = true;
        break;
      case 'FRAUD_CHECK':
      case 'EXTERNAL_VERIFICATION':
        steps[1].status = 'completed';
        steps[2].status = 'current';
        steps[2].current = true;
        break;
      case 'READY_FOR_DECISION':
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        steps[3].status = 'completed';
        steps[4].status = 'current';
        steps[4].current = true;
        break;
      case 'APPROVED':
      case 'REJECTED':
        steps.forEach(step => step.status = 'completed');
        steps[4].current = true;
        break;
    }

    return steps;
  });

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return this.loanOfficerService.formatCurrency(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    return this.loanOfficerService.formatDate(date);
  }

  /**
   * Format date and time
   */
  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    return this.loanOfficerService.getStatusBadgeClass(status);
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(priority: string): string {
    return this.loanOfficerService.getPriorityBadgeClass(priority);
  }

  /**
   * Get risk level badge class
   */
  getRiskLevelBadgeClass(riskLevel: string): string {
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }

  /**
   * Get document verification status badge class
   */
  getDocumentStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'UPLOADED': 'bg-blue-100 text-blue-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }


  /**
   * Get verified documents count
   */
  verifiedDocumentsCount = computed(() => {
    const documents = this.applicationDetails()?.documents || [];
    return documents.filter(doc => doc.verificationStatus === 'VERIFIED').length;
  });

  /**
   * Get total documents count
   */
  totalDocumentsCount = computed(() => {
    return this.applicationDetails()?.documents?.length || 0;
  });

  /**
   * Get verification percentage
   */
  verificationPercentage = computed(() => {
    const total = this.totalDocumentsCount();
    if (total === 0) return 0;
    return Math.round((this.verifiedDocumentsCount() / total) * 100);
  });

  /**
   * Download document using fetch and blob
   */
  downloadDocument(doc: DocumentInfo): void {
    this.notificationService.info('Download Started', `Downloading ${doc.fileName}...`);
    
    // Fetch the file as blob
    fetch(doc.fileUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.fileName || 'document.pdf';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        this.notificationService.success('Download Complete', `${doc.fileName} downloaded successfully`);
      })
      .catch(error => {
        console.error('Download error:', error);
        this.notificationService.error('Download Failed', 'Failed to download document. Opening in new tab instead.');
        window.open(doc.fileUrl, '_blank');
      });
  }

  /**
   * View document
   */
  viewDocument(document: DocumentInfo): void {
    // Open document in new tab or modal
    window.open(document.fileUrl, '_blank');
  }

}
