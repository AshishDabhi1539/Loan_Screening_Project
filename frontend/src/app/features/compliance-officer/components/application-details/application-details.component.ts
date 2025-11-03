import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComplianceService, LoanApplicationResponse } from '../../../../core/services/compliance.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { IdEncoderService } from '../../../../core/services/id-encoder.service';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.css'
})
export class ApplicationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);
  private idEncoder = inject(IdEncoderService);

  // State signals
  application = signal<any | null>(null);
  isLoading = signal(true);
  applicationId = signal<string>('');
  activeTab = signal<'information' | 'documents' | 'verification'>('information');

  // Computed properties for easier access
  applicationInfo = computed(() => this.application()?.applicationInfo);
  applicantIdentity = computed(() => this.application()?.applicantIdentity);
  employmentDetails = computed(() => this.application()?.employmentDetails);
  documents = computed(() => this.application()?.documents || []);
  financialAssessment = computed(() => this.application()?.financialAssessment);
  verificationSummary = computed(() => this.application()?.verificationSummary);

  ngOnInit(): void {
    // Get application ID from query parameters and decode it
    this.route.queryParams.subscribe(params => {
      const encodedId = params['ref'];
      if (encodedId) {
        // Decode the encoded ID from query parameter
        const decodedId = this.idEncoder.decodeId(encodedId);
        if (decodedId) {
          this.applicationId.set(decodedId);
          this.loadApplicationDetails(decodedId);
        } else {
          this.notificationService.error('Error', 'Invalid application reference');
          this.goBack();
        }
      } else {
        this.notificationService.error('Error', 'Application reference not found');
        this.goBack();
      }
    });
  }

  /**
   * Load complete application details
   */
  loadApplicationDetails(id: string): void {
    this.isLoading.set(true);

    this.complianceService.getCompleteApplicationDetails(id).subscribe({
      next: (data) => {
        this.application.set(data);
        this.isLoading.set(false);
        console.log('✅ Application details loaded:', data);
      },
      error: (error) => {
        console.error('❌ Error loading application details:', error);
        this.notificationService.error('Error', 'Failed to load application details');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Go back to applications list
   */
  goBack(): void {
    this.router.navigate(['/compliance-officer/applications']);
  }

  /**
   * Refresh application details
   */
  refresh(): void {
    this.loadApplicationDetails(this.applicationId());
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800',
      'COMPLIANCE_REVIEW': 'bg-yellow-100 text-yellow-800',
      'PENDING_COMPLIANCE_DOCS': 'bg-orange-100 text-orange-800',
      'READY_FOR_DECISION': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'APPROVED': 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge color
   */
  getPriorityBadgeColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Switch active tab
   */
  setActiveTab(tab: 'information' | 'documents' | 'verification'): void {
    this.activeTab.set(tab);
  }

  /**
   * Get document icon based on type
   */
  getDocumentIcon(documentType: string): string {
    const icons: { [key: string]: string } = {
      'PDF': 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      'IMAGE': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      'DOCUMENT': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return icons[documentType] || icons['DOCUMENT'];
  }

  /**
   * Get verification status badge color
   */
  getVerificationStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'NOT_VERIFIED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get risk level badge color
   */
  getRiskLevelColor(riskLevel: string): string {
    const colors: { [key: string]: string } = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'VERY_HIGH': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'VERY_LOW': 'bg-green-100 text-green-800'
    };
    return colors[riskLevel] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format loan type
   */
  formatLoanType(loanType: string | null | undefined): string {
    if (!loanType) return 'N/A';
    return loanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  }

  /**
   * Check if application can start investigation (status is FLAGGED_FOR_COMPLIANCE)
   */
  canStartInvestigation(): boolean {
    const status = this.applicationInfo()?.status;
    return status === 'FLAGGED_FOR_COMPLIANCE';
  }

  /**
   * Check if application is under compliance review
   */
  isUnderComplianceReview(): boolean {
    const status = this.applicationInfo()?.status;
    return status === 'COMPLIANCE_REVIEW' || status === 'PENDING_COMPLIANCE_DOCS';
  }

  /**
   * Start compliance investigation
   */
  startInvestigation(): void {
    const id = this.applicationId();
    if (!id) {
      this.notificationService.error('Error', 'Application ID not found');
      return;
    }

    // Show loading state
    this.isLoading.set(true);
    
    // Call the backend API
    this.complianceService.startInvestigation(id).subscribe({
      next: (response) => {
        console.log('✅ Investigation started:', response);
        
        // Show success notification
        this.notificationService.success(
          'Investigation Started',
          'Compliance investigation has been initiated successfully. The application status has been updated to Compliance Review.'
        );
        
        // Small delay before reloading to ensure backend has processed the status change
        setTimeout(() => {
          // Reload application details to get updated status
          this.loadApplicationDetails(id);
        }, 500);
      },
      error: (error) => {
        console.error('❌ Error starting investigation:', error);
        this.isLoading.set(false);
        
        // Extract error message properly
        let errorMessage = 'Failed to start investigation. Please try again.';
        
        if (error?.error) {
          // If error.error is a string (text response)
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } 
          // If error.error is an object with message
          else if (error.error.message) {
            errorMessage = error.error.message;
          }
          // If error.error is an object, try to stringify
          else if (typeof error.error === 'object') {
            errorMessage = JSON.stringify(error.error);
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
  }
}
