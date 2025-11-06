import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService } from '../../../../core/services/loan-officer.service';
import { CompleteApplicationDetailsResponse, DocumentInfo } from '../../../../core/models/officer.model';

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
  
  // View mode - determines if we show action buttons or not
  isViewMode = signal(false);

  /**
   * Display status for loan officer - frozen during compliance review
   * Uses service method for consistency across all components
   */
  displayStatus = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    if (!app) return '';
    
    // Special handling for compliance applications
    if (app.status === 'READY_FOR_DECISION' && app.fromCompliance === true) {
      return '✅ Reviewed by Compliance';
    }
    
    return this.loanOfficerService.getDisplayStatus(app.status || '');
  });

  ngOnInit(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    
    // Check if we're in view-only mode (from query param)
    this.route.queryParams.subscribe(params => {
      this.isViewMode.set(params['mode'] === 'view');
    });
    
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
    // Prevent access to external verification and audit trail tabs if external verification is not completed
    if ((tab === 'external' || tab === 'audit') && !this.isExternalVerificationCompleted()) {
      this.notificationService.warning(
        'Access Restricted',
        'External verification must be completed before accessing this tab.'
      );
      // Switch to overview tab instead
      this.activeTab.set('overview');
      return;
    }
    
    this.activeTab.set(tab);
    
    // Load audit trail when audit tab is clicked
    if (tab === 'audit' && this.auditTrail().length === 0) {
      this.loadAuditTrail();
    }
    
    // Refresh application details when external verification tab is clicked
    // This ensures we get the latest verification results
    if (tab === 'external') {
      const appId = this.applicationDetails()?.applicationInfo?.id;
      if (appId) {
        this.loadApplicationDetails(appId);
      }
    }
  }

  /**
   * Load audit trail - shows balanced amount of important events
   */
  private loadAuditTrail(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (!appId) return;

    this.isLoadingAudit.set(true);
    this.loanOfficerService.getAuditTrail(appId).subscribe({
      next: (trail) => {
        // Sort by timestamp descending (newest first)
        const sortedTrail = trail.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Group events by type and keep only the most recent of each type
        const uniqueEvents = new Map<string, any>();
        
        sortedTrail.forEach(entry => {
          const action = entry.action;
          
          // For status changes, keep all of them (important milestones)
          if (action.includes('STATUS') || action.includes('DECISION') || 
              action.includes('APPROVED') || action.includes('REJECTED') ||
              action.includes('ASSIGNED') || action.includes('COMPLIANCE')) {
            const key = `${action}_${entry.timestamp}`;
            uniqueEvents.set(key, entry);
          }
          // For document actions, keep only first occurrence of each type
          else if (action.includes('DOCUMENT')) {
            if (!uniqueEvents.has(action)) {
              uniqueEvents.set(action, entry);
            }
          }
          // For verification actions, keep all
          else if (action.includes('VERIFICATION')) {
            const key = `${action}_${entry.timestamp}`;
            uniqueEvents.set(key, entry);
          }
          // For other actions, keep only if not already present
          else {
            if (!uniqueEvents.has(action)) {
              uniqueEvents.set(action, entry);
            }
          }
        });
        
        // Convert back to array and sort
        const filteredTrail = Array.from(uniqueEvents.values()).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Limit to 15 most recent events for better UX
        this.auditTrail.set(filteredTrail.slice(0, 15));
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
   * Get action icon based on action type
   */
  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'APPLICATION_SUBMITTED': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'STATUS_CHANGED': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'DOCUMENT_UPLOADED': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      'DOCUMENT_VERIFIED': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'DOCUMENT_REJECTED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'EXTERNAL_VERIFICATION': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'APPROVED': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'REJECTED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'ASSIGNED': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'COMMENT_ADDED': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    };
    return iconMap[action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  /**
   * Get action color based on action type
   */
  getActionColor(action: string): string {
    const colorMap: { [key: string]: string } = {
      'APPLICATION_SUBMITTED': 'bg-blue-100 text-blue-800',
      'STATUS_CHANGED': 'bg-purple-100 text-purple-800',
      'DOCUMENT_UPLOADED': 'bg-indigo-100 text-indigo-800',
      'DOCUMENT_VERIFIED': 'bg-green-100 text-green-800',
      'DOCUMENT_REJECTED': 'bg-red-100 text-red-800',
      'EXTERNAL_VERIFICATION': 'bg-cyan-100 text-cyan-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'ASSIGNED': 'bg-yellow-100 text-yellow-800',
      'COMMENT_ADDED': 'bg-gray-100 text-gray-800'
    };
    return colorMap[action] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format action name for display
   */
  formatActionName(action: string): string {
    return action.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get time difference in human-readable format
   */
  getTimeDifference(timestamp: Date | string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return this.formatDate(timestamp);
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
   * Resume external verification - Navigate to review page step 3
   */
  resumeExternalVerification(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      // Navigate to review page - it will auto-set to step 3 (External Verification)
      this.router.navigate(['/loan-officer/application', appId, 'review']);
    }
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
   * Navigate to decision page
   */
  makeDecision(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'decision']);
    }
  }

  /**
   * Start verification process - changes status UNDER_REVIEW to DOCUMENT_VERIFICATION
   */
  startVerificationProcess(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      // Call API to start document verification (changes status to DOCUMENT_VERIFICATION)
      this.loanOfficerService.startDocumentVerification(appId).subscribe({
        next: (response) => {
          this.notificationService.success('Success', 'Verification process started successfully');
          // Navigate to review workflow page
          this.router.navigate(['/loan-officer/application', appId, 'review']);
        },
        error: (error) => {
          console.error('Error starting verification:', error);
          this.notificationService.error(
            'Error',
            error.error?.message || 'Failed to start verification process'
          );
        }
      });
    }
  }

  /**
   * Navigate to review workflow page - NO API call, NO status change
   * Always starts from Step 1 (Overview)
   */
  navigateToReviewWorkflow(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      // Navigate to review page with query param to force Step 1
      this.router.navigate(['/loan-officer/application', appId, 'review'], {
        queryParams: { step: 1 }
      });
    }
  }

  /**
   * Navigate back to applications list
   */
  viewApplicationDetails(): void {
    this.router.navigate(['/loan-officer/applications/assigned']);
  }

  /**
   * Navigate back - either to review page or applications list
   */
  goBack(): void {
    const fromReview = this.route.snapshot.queryParams['from'] === 'review';
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const appId = this.applicationDetails()?.applicationInfo?.id;
    
    if (fromReview && appId) {
      // Navigate back to review page
      this.router.navigate(['/loan-officer/application', appId, 'review']);
    } else if (returnUrl) {
      // Navigate back to the specified return URL
      this.router.navigateByUrl(returnUrl);
    } else {
      // Default: Navigate back to assigned applications list
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Get back button text based on navigation context
   */
  getBackButtonText(): string {
    const fromReview = this.route.snapshot.queryParams['from'] === 'review';
    return fromReview ? 'Back to Review' : 'Back to Applications';
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
   * Determine if action buttons should be shown
   * Show buttons for all active workflow statuses (not final statuses)
   */
  shouldShowActionButtons = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    if (!app) return false;
    
    // Always show action buttons for active workflow statuses
    // The HTML template will filter out final statuses (APPROVED, REJECTED, etc.)
    return true;
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
   * Check if personal details are verified
   */
  isPersonalDetailsVerified = computed(() => {
    const verificationStatus = this.applicationDetails()?.applicantIdentity?.verificationStatus;
    if (!verificationStatus) return false;
    // Check if both identity and address are verified
    return verificationStatus.identityVerified === true && verificationStatus.addressVerified === true;
  });

  /**
   * Get contact info
   */
  getContactInfo = computed(() => {
    return this.applicationDetails()?.applicantIdentity?.contactInfo;
  });

  /**
   * Check if financial details are verified
   */
  isFinancialDetailsVerified = computed(() => {
    const verificationStatus = this.applicationDetails()?.employmentDetails?.verificationStatus;
    if (!verificationStatus) return false;
    // Check if employment, income, and bank are all verified
    return verificationStatus.employmentVerified === true && 
           verificationStatus.incomeVerified === true && 
           verificationStatus.bankAccountVerified === true;
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
      existingEmi: employment?.existingLoanEmi || 0,
      otherObligations: 0, // Not in backend structure
      foir: financial?.calculatedRatios?.emiToIncomeRatio || 0,
      creditCardOutstanding: employment?.creditCardOutstanding || 0,
      monthlyExpenses: employment?.monthlyExpenses || 0,
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
   * Get external verification info - returns real data from API if available
   */
  getExternalVerification = computed(() => {
    const externalVerification = this.applicationDetails()?.externalVerification;
    
    // Return real data if available
    if (externalVerification) {
      return externalVerification;
    }
    
    // Fallback: return null if no external verification has been completed
    return null;
  });

  /**
   * Check if external verification step has been completed
   * External verification is considered started/completed when status is EXTERNAL_VERIFICATION or later
   */
  isExternalVerificationCompleted = computed(() => {
    const app = this.applicationDetails()?.applicationInfo;
    if (!app || !app.status) return false;
    
    const status = app.status;
    // External verification is considered complete if status is EXTERNAL_VERIFICATION or later
    const completedStatuses = [
      'EXTERNAL_VERIFICATION',
      'FRAUD_CHECK',
      'READY_FOR_DECISION',
      'APPROVED',
      'REJECTED',
      'DISBURSED',
      'CANCELLED'
    ];
    
    return completedStatuses.includes(status);
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
      case 'DOCUMENT_REVERIFICATION':
        return {
          text: 'Re-verify Documents',
          action: 'reverify-documents',
          color: 'bg-orange-600 hover:bg-orange-700',
          icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
          method: () => this.startDocumentVerification()
        };
      case 'PENDING_EXTERNAL_VERIFICATION':
        return {
          text: 'Resume External Verification',
          action: 'resume-external',
          color: 'bg-indigo-600 hover:bg-indigo-700',
          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
          method: () => this.resumeExternalVerification()
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
          text: 'Start Verification Process',
          action: 'start-verification-process',
          color: 'bg-blue-600 hover:bg-blue-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          method: () => this.startVerificationProcess()
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
   * Uses displayStatus() to show frozen status during compliance review
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

    // Use displayStatus() instead of app.status to show frozen status during compliance
    const status = this.displayStatus();
    
    switch (status) {
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
      case 'FLAGGED_FOR_COMPLIANCE':
        // Application flagged for compliance review
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        steps[3].status = 'current';
        steps[3].current = true;
        steps[3].name = 'Compliance Review';
        break;
      case '✅ Reviewed by Compliance':
        // Compliance review completed, ready for final decision
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        steps[3].status = 'completed';
        steps[3].name = 'Review Process';
        steps[4].status = 'current';
        steps[4].current = true;
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
    // Special handling for compliance reviewed status
    if (status === '✅ Reviewed by Compliance') {
      return 'bg-green-100 text-green-800';
    }
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
   * Get sorted and filtered documents (most recent first, duplicates removed)
   */
  sortedDocuments = computed(() => {
    const documents = this.applicationDetails()?.documents || [];
    
    // First, apply smart filtering to remove duplicates
    const filtered = this.getSmartFilteredDocuments(documents);
    
    // Then sort by upload date (most recent first)
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });
  });

  /**
   * Smart document filtering - shows only active/recent versions
   * Same logic as document-verification component
   */
  private getSmartFilteredDocuments(documents: any[]): any[] {
    if (!documents || documents.length === 0) return [];
    
    const documentsByType = new Map<string, any[]>();
    
    // Group documents by document type
    documents.forEach(doc => {
      const type = doc.documentType;
      if (!documentsByType.has(type)) {
        documentsByType.set(type, []);
      }
      documentsByType.get(type)!.push(doc);
    });
    
    const filteredDocuments: any[] = [];
    
    documentsByType.forEach((docs, type) => {
      // Separate by verification status
      const pending = docs.filter(d => d.verificationStatus === 'PENDING');
      const verified = docs.filter(d => d.verificationStatus === 'VERIFIED');
      const rejected = docs.filter(d => d.verificationStatus === 'REJECTED');
      
      if (pending.length > 0) {
        // Show latest PENDING (re-uploaded document)
        const latest = pending.sort((a, b) => {
          const dateA = new Date(a.uploadDate || a.uploadedAt).getTime();
          const dateB = new Date(b.uploadDate || b.uploadedAt).getTime();
          return dateB - dateA;
        })[0];
        filteredDocuments.push(latest);
      } else if (verified.length > 0) {
        // Show VERIFIED document
        filteredDocuments.push(verified[0]);
      } else if (rejected.length > 0) {
        // Show latest REJECTED (if not yet re-uploaded)
        const latest = rejected.sort((a, b) => {
          const dateA = new Date(a.uploadDate || a.uploadedAt).getTime();
          const dateB = new Date(b.uploadDate || b.uploadedAt).getTime();
          return dateB - dateA;
        })[0];
        filteredDocuments.push(latest);
      }
    });
    
    return filteredDocuments;
  }

  /**
   * Get verified documents count (from filtered documents)
   */
  verifiedDocumentsCount = computed(() => {
    const documents = this.sortedDocuments();
    return documents.filter(doc => doc.verificationStatus === 'VERIFIED').length;
  });

  /**
   * Get total documents count (from filtered documents)
   */
  totalDocumentsCount = computed(() => {
    return this.sortedDocuments().length;
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

  /**
   * Parse risk factors string into structured data
   * Example input: "🚨 RED ALERT: Extremely high risk (100/100); Very poor credit score (390); Some missed payments (3); Some cheque bounces (2); Very high outstanding debt (₹4110000.00);"
   */
  parseRiskFactors(riskFactorsText: string): { 
    alertLevel: string; 
    riskScore: string; 
    factors: Array<{ icon: string; label: string; value: string; severity: 'critical' | 'high' | 'medium' | 'low' }> 
  } | null {
    if (!riskFactorsText) return null;

    try {
      // Extract alert level
      const alertMatch = riskFactorsText.match(/🚨\s*(RED ALERT|YELLOW ALERT|GREEN ALERT|ALERT)/i);
      const alertLevel = alertMatch ? alertMatch[1] : 'ALERT';

      // Extract risk score
      const riskScoreMatch = riskFactorsText.match(/risk\s*\((\d+\/\d+)\)/i);
      const riskScore = riskScoreMatch ? riskScoreMatch[1] : '';

      // Parse individual factors
      const factors: Array<{ icon: string; label: string; value: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = [];

      // Credit Score
      const creditScoreMatch = riskFactorsText.match(/(Very poor|Poor|Fair|Good|Excellent)\s+credit score\s*\((\d+)\)/i);
      if (creditScoreMatch) {
        const score = parseInt(creditScoreMatch[2]);
        factors.push({
          icon: '📊',
          label: 'Credit Score',
          value: `${creditScoreMatch[1]} (${score})`,
          severity: score < 450 ? 'critical' : score < 550 ? 'high' : score < 650 ? 'medium' : 'low'
        });
      }

      // Missed Payments
      const missedPaymentsMatch = riskFactorsText.match(/(Some|Many|Few|No)\s+missed payments\s*\((\d+)\)/i);
      if (missedPaymentsMatch) {
        const count = parseInt(missedPaymentsMatch[2]);
        factors.push({
          icon: '⚠️',
          label: 'Missed Payments',
          value: `${count} payment${count !== 1 ? 's' : ''}`,
          severity: count > 5 ? 'critical' : count > 2 ? 'high' : count > 0 ? 'medium' : 'low'
        });
      }

      // Cheque Bounces
      const chequeBounceMatch = riskFactorsText.match(/(Some|Many|Few|No)\s+cheque bounces\s*\((\d+)\)/i);
      if (chequeBounceMatch) {
        const count = parseInt(chequeBounceMatch[2]);
        factors.push({
          icon: '💳',
          label: 'Cheque Bounces',
          value: `${count} bounce${count !== 1 ? 's' : ''}`,
          severity: count > 3 ? 'critical' : count > 1 ? 'high' : count > 0 ? 'medium' : 'low'
        });
      }

      // Outstanding Debt
      const debtMatch = riskFactorsText.match(/(Very high|High|Moderate|Low)\s+outstanding debt\s*\(₹([\d,]+(?:\.\d+)?)\)/i);
      if (debtMatch) {
        const amount = parseFloat(debtMatch[2].replace(/,/g, ''));
        factors.push({
          icon: '💰',
          label: 'Outstanding Debt',
          value: this.formatCurrency(amount),
          severity: amount > 3000000 ? 'critical' : amount > 1500000 ? 'high' : amount > 500000 ? 'medium' : 'low'
        });
      }

      // Fraud Cases
      const fraudMatch = riskFactorsText.match(/(\d+)\s+active fraud case/i);
      if (fraudMatch) {
        const count = parseInt(fraudMatch[1]);
        if (count > 0) {
          factors.push({
            icon: '🚫',
            label: 'Active Fraud Cases',
            value: `${count} case${count !== 1 ? 's' : ''}`,
            severity: 'critical'
          });
        }
      }

      // Defaults
      if (riskFactorsText.match(/has\s+defaults/i)) {
        factors.push({
          icon: '❌',
          label: 'Default History',
          value: 'Defaults found',
          severity: 'critical'
        });
      }

      return { alertLevel, riskScore, factors };
    } catch (error) {
      console.error('Error parsing risk factors:', error);
      return null;
    }
  }

  /**
   * Get severity badge class
   */
  getSeverityClass(severity: 'critical' | 'high' | 'medium' | 'low'): string {
    const classes = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return classes[severity] || classes.medium;
  }

}
