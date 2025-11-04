import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComplianceService, LoanApplicationResponse, ComplianceInvestigationResponse, ComplianceDocumentRequest } from '../../../../core/services/compliance.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { IdEncoderService } from '../../../../core/services/id-encoder.service';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
  activeTab = signal<'information' | 'verification' | 'investigation'>('information');
  investigationResults = signal<ComplianceInvestigationResponse | null>(null);
  isRunningInvestigation = signal(false);

  // Request additional documents modal state
  showRequestDocsModal = signal(false);
  requestDocsItems = signal<{ documentType: string; reason: string }[]>([]);
  requestDocsInstructions = signal('');
  requestDocsDueDate = signal(''); // YYYY-MM-DD
  minDueDate = computed(() => this.getTodayStr());
  requestDocsReason = signal('');
  requestDocsPriority = signal<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  requestDocsMandatory = signal(false);
  requestDocsCategory = signal('COMPLIANCE_EXTRA');

  // Compliance document request details
  complianceDocumentRequest = signal<{
    requiredDocumentTypes: string[];
    status?: string;
  } | null>(null);

  // Verification modal state
  showVerificationModal = signal(false);
  verificationDocumentId = signal<number | null>(null);
  verificationDocumentType = signal<string>('');
  verificationDocumentFileName = signal<string>('');
  verificationDecision = signal<'approve' | 'reject' | null>(null);
  verificationNotes = signal('');
  verificationRejectionReason = signal('');

  // Trigger Decision modal state
  showTriggerDecisionModal = signal(false);
  triggerDecisionSummaryNotes = signal('');

  // Computed properties for easier access
  applicationInfo = computed(() => this.application()?.applicationInfo);
  applicantIdentity = computed(() => this.application()?.applicantIdentity);
  employmentDetails = computed(() => this.application()?.employmentDetails);
  documents = computed(() => this.application()?.documents || []);
  complianceOnlyDocuments = computed<any[]>(() => (this.documents() || []).filter((d: any) => this.isComplianceOnlyDoc(d)));
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
          // Restore investigation results from localStorage before loading application details
          this.restoreInvestigationResults(decodedId);
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
        // If status is UNDER_INVESTIGATION, try to restore investigation results
        if (data?.applicationInfo?.status === 'UNDER_INVESTIGATION') {
          this.restoreInvestigationResults(id);
        }
        
        // Load compliance document request details to identify requested document types
        this.loadComplianceDocumentRequestDetails(id);
      },
      error: (error) => {
        console.error('❌ Error loading application details:', error);
        this.notificationService.error('Error', 'Failed to load application details');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load compliance document request details to identify which document types were requested
   */
  loadComplianceDocumentRequestDetails(applicationId: string): void {
    this.complianceService.getComplianceDocumentRequestDetails(applicationId).subscribe({
      next: (data: any) => {
        this.complianceDocumentRequest.set({
          requiredDocumentTypes: data.requiredDocumentTypes || [],
          status: data.status
        });
        console.log('✅ Compliance document request details loaded:', data);
      },
      error: (error: any) => {
        console.error('❌ Error loading compliance document request details:', error);
        // Don't show error to user, just set empty list
        this.complianceDocumentRequest.set({
          requiredDocumentTypes: [],
          status: 'NONE'
        });
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

  /** Open/close Request Documents modal */
  openRequestDocsModal(): void {
    // Ensure at least one row exists
    if (this.requestDocsItems().length === 0) {
      this.requestDocsItems.set([{ documentType: '', reason: '' }]);
    }
    // Default due date to today if empty
    if (!this.requestDocsDueDate()) {
      this.requestDocsDueDate.set(this.getTodayStr());
    }
    this.showRequestDocsModal.set(true);
  }
  closeRequestDocsModal(): void {
    this.showRequestDocsModal.set(false);
  }

  addRequestDoc(): void {
    this.requestDocsItems.update(list => [...list, { documentType: '', reason: '' }]);
  }
  removeRequestDoc(index: number): void {
    const current = this.requestDocsItems();
    if (current.length <= 1) {
      this.notificationService.warning?.('Not Allowed', 'At least one document is required');
      return;
    }
    this.requestDocsItems.update(list => list.filter((_, i) => i !== index));
  }

  updateRequestDocType(index: number, value: string): void {
    this.requestDocsItems.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], documentType: value };
      return copy;
    });
  }

  updateRequestDocReason(index: number, value: string): void {
    this.requestDocsItems.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], reason: value };
      return copy;
    });
  }

  submitRequestDocuments(): void {
    const appId = this.applicationId();
    if (!appId) {
      this.notificationService.error('Error', 'Application ID not found');
      return;
    }

    const items = this.requestDocsItems().filter(i => i.documentType && i.documentType.trim().length > 0);
    if (items.length === 0) {
      this.notificationService.error('Validation', 'Add at least one document type to request');
      return;
    }

    if (!this.requestDocsReason() || this.requestDocsReason().trim().length === 0) {
      this.notificationService.error('Validation', 'Provide a request reason');
      return;
    }

    if (!this.requestDocsDueDate()) {
      this.notificationService.error('Validation', 'Select a due date');
      return;
    }
    if (this.isDueDatePast(this.requestDocsDueDate())) {
      this.notificationService.error('Validation', 'Due date cannot be in the past');
      return;
    }

    const payload: ComplianceDocumentRequest = {
      requiredDocumentTypes: items.map(i => i.documentType),
      requestReason: this.requestDocsReason().trim(),
      additionalInstructions: this.requestDocsInstructions() ? `[COMPLIANCE_ONLY] ${this.requestDocsInstructions().trim()}` : undefined,
      deadlineDays: this.getDeadlineDaysFrom(this.requestDocsDueDate()),
      priorityLevel: this.requestDocsPriority(),
      isMandatory: this.requestDocsMandatory(),
      complianceCategory: this.requestDocsCategory()
    };

    this.complianceService.requestAdditionalDocuments(appId, payload).subscribe({
      next: () => {
        this.notificationService.success('Requested', 'Additional documents requested from applicant');
        this.showRequestDocsModal.set(false);
        // Optionally reload details to reflect pending docs state on compliance side
        this.loadApplicationDetails(appId);
      },
      error: (err) => {
        console.error('Error requesting additional documents', err);
        this.notificationService.error('Error', 'Failed to request additional documents');
      }
    });
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800',
      'COMPLIANCE_REVIEW': 'bg-yellow-100 text-yellow-800',
      'UNDER_INVESTIGATION': 'bg-purple-100 text-purple-800',
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
  setActiveTab(tab: 'information' | 'verification' | 'investigation'): void {
    this.activeTab.set(tab);
  }

  /**
   * Check if investigation has been performed
   */
  hasInvestigationResults(): boolean {
    return this.investigationResults() !== null;
  }

  /**
   * Perform comprehensive compliance investigation
   */
  performInvestigation(): void {
    const id = this.applicationId();
    if (!id) {
      this.notificationService.error('Error', 'Application ID not found');
      return;
    }

    this.isRunningInvestigation.set(true);

    this.complianceService.performComprehensiveInvestigation(id).subscribe({
      next: (response) => {
        console.log('✅ Investigation completed:', response);
        this.investigationResults.set(response);
        this.isRunningInvestigation.set(false);
        this.activeTab.set('investigation'); // Switch to investigation tab
        
        // Persist investigation results to localStorage
        this.saveInvestigationResults(id, response);
        
        // Reload application details to get updated status
        setTimeout(() => {
          this.loadApplicationDetails(id);
        }, 500);
        
        this.notificationService.success(
          'Investigation Completed',
          'Comprehensive compliance investigation has been completed successfully. Application status updated to Under Investigation. Review the results in the Investigation tab.'
        );
      },
      error: (error) => {
        console.error('❌ Error performing investigation:', error);
        this.isRunningInvestigation.set(false);
        
        let errorMessage = 'Failed to perform investigation. Please try again.';
        if (error?.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
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
   * Format JSON for display
   */
  formatJSON(obj: any): string {
    if (!obj) return 'N/A';
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }

  /**
   * Get band color based on risk band
   */
  getBandColor(band: string): string {
    const bandColors: { [key: string]: string } = {
      'EXCELLENT': 'bg-green-100 text-green-800',
      'GOOD': 'bg-blue-100 text-blue-800',
      'FAIR': 'bg-yellow-100 text-yellow-800',
      'POOR': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return bandColors[band?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format compliance decision for display
   */
  formatComplianceDecision(decision: string): string {
    if (!decision) return 'N/A';
    return decision.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get compliance decision color
   */
  getComplianceDecisionColor(decision: string): string {
    if (!decision) return 'bg-gray-100 text-gray-800';
    const upperDecision = decision.toUpperCase();
    if (upperDecision.includes('PROCEED') || upperDecision.includes('APPROVED')) {
      return 'bg-green-100 text-green-800';
    } else if (upperDecision.includes('REJECT') || upperDecision.includes('IMMEDIATE')) {
      return 'bg-red-100 text-red-800';
    } else if (upperDecision.includes('CONDITIONAL') || upperDecision.includes('ENHANCED')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Check if value is an array
   */
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Block actions when pending compliance documents
   */
  isBlockedByPendingDocs(): boolean {
    return (this.applicationInfo()?.status === 'PENDING_COMPLIANCE_DOCS');
  }

  /**
   * Local date string YYYY-MM-DD (no timezone shift)
   */
  private getTodayStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isDueDatePast(dateStr: string): boolean {
    if (!dateStr) return false;
    const today = new Date(this.getTodayStr());
    const sel = new Date(dateStr);
    // Compare date-only
    return sel.getTime() < today.getTime();
  }

  private getDeadlineDaysFrom(dateStr: string): number {
    const today = new Date(this.getTodayStr());
    const sel = new Date(dateStr);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.ceil((sel.getTime() - today.getTime()) / msPerDay);
    return Math.max(diff, 0);
  }

  /** Compliance-only documents: review state */
  complianceReviewNotes = signal('');
  complianceDocDecisions = signal<Record<string, { verified: boolean | null; notes?: string; rejectionReason?: string }>>({});

  setComplianceDocDecision(documentId: string, verified: boolean): void {
    const current = { ...this.complianceDocDecisions() };
    current[documentId] = { ...(current[documentId] || { verified: null }), verified };
    this.complianceDocDecisions.set(current);
  }

  setComplianceDocNotes(documentId: string, value: string): void {
    const current = { ...this.complianceDocDecisions() };
    current[documentId] = { ...(current[documentId] || { verified: null }), notes: value };
    this.complianceDocDecisions.set(current);
  }

  setComplianceDocRejectionReason(documentId: string, value: string): void {
    const current = { ...this.complianceDocDecisions() };
    current[documentId] = { ...(current[documentId] || { verified: null }), rejectionReason: value };
    this.complianceDocDecisions.set(current);
  }

  canSubmitComplianceDocReview(): boolean {
    const docs = this.complianceOnlyDocuments();
    if (!docs || docs.length === 0) return false;
    const decisions = this.complianceDocDecisions();
    // At least one decision must be made, and any rejected must have a reason
    let hasAny = false;
    for (const doc of docs) {
      const entry = decisions[doc.documentId];
      if (entry && entry.verified !== null) {
        hasAny = true;
        if (entry.verified === false && (!entry.rejectionReason || entry.rejectionReason.trim().length === 0)) {
          return false;
        }
      }
    }
    return hasAny;
  }

  submitComplianceDocReview(): void {
    const appId = this.applicationId();
    if (!appId) {
      this.notificationService.error('Error', 'Application ID not found');
      return;
    }
    const docs = this.complianceOnlyDocuments();
    const decisions = this.complianceDocDecisions();
    const payload = {
      documentVerifications: docs
        .filter((d: any) => decisions[d.documentId] && decisions[d.documentId].verified !== null)
        .map((d: any) => ({
          documentId: String(d.documentId),
          verified: Boolean(decisions[d.documentId].verified),
          verificationNotes: decisions[d.documentId].verified ? (decisions[d.documentId].notes || 'Compliance verification') : undefined,
          rejectionReason: decisions[d.documentId].verified ? undefined : (decisions[d.documentId].rejectionReason || 'Not acceptable')
        })),
      generalNotes: this.complianceReviewNotes()
    };

    if (payload.documentVerifications.length === 0) {
      this.notificationService.error('Validation', 'Select approve/reject for at least one document');
      return;
    }

    this.isLoading.set(true);
    this.complianceService.verifyComplianceDocuments(appId, payload).subscribe({
      next: () => {
        this.notificationService.success('Submitted', 'Compliance document review submitted');
        this.isLoading.set(false);
        // Refresh to reflect any status changes
        this.loadApplicationDetails(appId);
      },
      error: (err) => {
        console.error('Compliance review submit error', err);
        this.notificationService.error('Error', 'Failed to submit compliance document review');
        this.isLoading.set(false);
      }
    });
  }

  isComplianceOnlyDoc(doc: any): boolean {
    try {
      if (!doc) return false;
      
      // Method 1: Check if document type matches any requested document types from ComplianceDocumentRequest
      const requestDetails = this.complianceDocumentRequest();
      if (requestDetails && requestDetails.requiredDocumentTypes && requestDetails.requiredDocumentTypes.length > 0) {
        const docType = doc.documentType?.toString().toUpperCase();
        const isRequested = requestDetails.requiredDocumentTypes.some(
          (requestedType: string) => requestedType.toUpperCase() === docType
        );
        if (isRequested) {
          return true;
        }
      }
      
      // Method 2: Fallback - check verificationNotes for [COMPLIANCE_ONLY] tag
      // This handles cases where documents were uploaded during PENDING_COMPLIANCE_DOCS status
      if (typeof doc.verificationNotes === 'string' && doc.verificationNotes.includes('[COMPLIANCE_ONLY]')) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking compliance document:', error, doc);
      return false;
    }
  }

  /**
   * Check if there are pending compliance documents that need verification
   */
  hasPendingComplianceDocuments(): boolean {
    const complianceDocs = this.complianceOnlyDocuments();
    return complianceDocs.some((doc: any) => 
      doc.verificationStatus === 'PENDING' || !doc.verificationStatus
    );
  }

  /**
   * Check if compliance documents have been received and are pending verification
   * Button should only show when documents are received but not yet verified/rejected
   */
  hasReceivedComplianceDocuments(): boolean {
    const complianceDocs = this.complianceOnlyDocuments();
    // Only show button if there are compliance documents that are still pending verification
    const hasPendingDocs = complianceDocs.some((doc: any) => 
      doc.verificationStatus === 'PENDING' || !doc.verificationStatus
    );
    // Button should show when:
    // 1. Status is PENDING_COMPLIANCE_DOCS (documents requested)
    // 2. AND there are compliance documents that are pending verification
    return hasPendingDocs && (this.applicationInfo()?.status === 'PENDING_COMPLIANCE_DOCS' || 
                               this.applicationInfo()?.status === 'UNDER_INVESTIGATION');
  }

  /**
   * Track document view when compliance officer opens document
   */
  onDocumentView(documentId: number): void {
    const doc = this.complianceOnlyDocuments().find((d: any) => d.documentId === documentId);
    if (!doc || !this.isComplianceOnlyDoc(doc)) {
      return; // Not a compliance document, don't track
    }

    // Track the view
    this.complianceService.trackDocumentView(documentId).subscribe({
      next: () => {
        // Reload application details to get updated view tracking
        this.loadApplicationDetails(this.applicationId());
      },
      error: (err) => {
        console.error('Error tracking document view:', err);
        // Don't show error, just continue
      }
    });
  }

  /**
   * Open verification modal for a document
   */
  openVerificationModal(documentId: number): void {
    const doc = this.complianceOnlyDocuments().find((d: any) => d.documentId === documentId);
    if (!doc || !this.isComplianceOnlyDoc(doc)) {
      this.notificationService.error('Error', 'Document not found or not a compliance document');
      return;
    }

    this.verificationDocumentId.set(documentId);
    this.verificationDocumentType.set(doc.documentType || 'Unknown');
    this.verificationDocumentFileName.set(doc.fileName || 'Unknown');
    this.verificationDecision.set(null);
    this.verificationNotes.set('');
    this.verificationRejectionReason.set('');
    this.showVerificationModal.set(true);
  }

  /**
   * Close verification modal
   */
  closeVerificationModal(): void {
    this.showVerificationModal.set(false);
    this.verificationDocumentId.set(null);
    this.verificationDocumentType.set('');
    this.verificationDocumentFileName.set('');
    this.verificationDecision.set(null);
    this.verificationNotes.set('');
    this.verificationRejectionReason.set('');
  }

  /**
   * Submit document verification
   */
  submitDocumentVerification(): void {
    const documentId = this.verificationDocumentId();
    if (!documentId) {
      this.notificationService.error('Error', 'Document ID is missing');
      return;
    }

    const decision = this.verificationDecision();
    if (!decision) {
      this.notificationService.error('Validation', 'Please select Approve or Reject');
      return;
    }

    const verified = decision === 'approve';
    const notes = verified ? this.verificationNotes() : '';
    const rejectionReason = !verified ? this.verificationRejectionReason() : '';

    if (!verified && (!rejectionReason || rejectionReason.trim().length === 0)) {
      this.notificationService.error('Validation', 'Rejection reason is required');
      return;
    }

    // Close modal immediately for better UX
    this.closeVerificationModal();

    this.complianceService.verifySingleComplianceDocument(documentId, verified, notes, rejectionReason).subscribe({
      next: () => {
        this.notificationService.success(
          verified ? 'Document Verified' : 'Document Rejected',
          verified ? 'Document has been verified successfully. Applicant has been notified.' : 'Document has been rejected. Applicant has been notified.'
        );
        // Reload application details to get latest status from server
        // Status will only update after server confirms the change
        this.loadApplicationDetails(this.applicationId());
      },
      error: (err: any) => {
        console.error('Error verifying document:', err);
        this.notificationService.error(
          'Error',
          err.error?.message || 'Failed to verify document'
        );
        // Reload to get correct status from server
        this.loadApplicationDetails(this.applicationId());
      }
    });
  }

  /**
   * Verify a single compliance document (kept for backward compatibility, but opens modal now)
   */
  verifyComplianceDocument(documentId: number, verified: boolean): void {
    // Open modal instead of direct verification
    this.openVerificationModal(documentId);
    // Pre-select the decision
    this.verificationDecision.set(verified ? 'approve' : 'reject');
  }

  /**
   * Check if request documents button should be disabled
   */
  canRequestDocuments(): boolean {
    // Don't allow if there are pending compliance documents
    if (this.hasPendingComplianceDocuments()) {
      return false;
    }
    // Also check the status
    return !this.isBlockedByPendingDocs();
  }

  /**
   * Check if trigger decision button should be shown
   */
  canTriggerDecision(): boolean {
    const status = this.applicationInfo()?.status;
    // Can trigger decision when in UNDER_INVESTIGATION status and no pending documents
    return status === 'UNDER_INVESTIGATION' && !this.hasPendingComplianceDocuments();
  }

  /**
   * Open trigger decision modal
   */
  openTriggerDecisionModal(): void {
    this.triggerDecisionSummaryNotes.set('');
    this.showTriggerDecisionModal.set(true);
  }

  /**
   * Close trigger decision modal
   */
  closeTriggerDecisionModal(): void {
    this.showTriggerDecisionModal.set(false);
    this.triggerDecisionSummaryNotes.set('');
  }

  /**
   * Submit trigger decision
   */
  submitTriggerDecision(): void {
    const summaryNotes = this.triggerDecisionSummaryNotes().trim();
    if (!summaryNotes) {
      this.notificationService.error('Validation', 'Summary notes are required');
      return;
    }

    this.complianceService.triggerDecision(this.applicationId(), { summaryNotes }).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Decision process triggered successfully');
        this.closeTriggerDecisionModal();
        // Navigate to decision page
        this.router.navigate(['/compliance-officer/decision']);
      },
      error: (err: any) => {
        console.error('Error triggering decision:', err);
        this.notificationService.error('Error', err.error?.message || 'Failed to trigger decision');
      }
    });
  }

  /**
   * Scroll to documents section
   */
  scrollToDocuments(): void {
    const element = document.getElementById('documents-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * UI helper: disable Request button when invalid
   */
  isRequestDocsSubmitDisabled(): boolean {
    const docsCount = this.requestDocsItems().filter(i => i.documentType && i.documentType.trim().length > 0).length;
    const due = this.requestDocsDueDate();
    const reason = this.requestDocsReason();
    return (
      docsCount === 0 ||
      !due || this.isDueDatePast(due) ||
      !reason || reason.trim().length === 0
    );
  }

  /**
   * Save investigation results to localStorage
   */
  private saveInvestigationResults(applicationId: string, results: ComplianceInvestigationResponse): void {
    try {
      const key = `investigation_${applicationId}`;
      localStorage.setItem(key, JSON.stringify(results));
      console.log('✅ Investigation results saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving investigation results to localStorage:', error);
    }
  }

  /**
   * Restore investigation results from localStorage
   */
  private restoreInvestigationResults(applicationId: string): void {
    try {
      const key = `investigation_${applicationId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const results = JSON.parse(stored) as ComplianceInvestigationResponse;
        this.investigationResults.set(results);
        console.log('✅ Investigation results restored from localStorage');
      }
    } catch (error) {
      console.error('❌ Error restoring investigation results from localStorage:', error);
    }
  }

  /**
   * Clear investigation results from localStorage
   */
  private clearInvestigationResults(applicationId: string): void {
    try {
      const key = `investigation_${applicationId}`;
      localStorage.removeItem(key);
      console.log('✅ Investigation results cleared from localStorage');
    } catch (error) {
      console.error('❌ Error clearing investigation results from localStorage:', error);
    }
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
    return status === 'COMPLIANCE_REVIEW' || status === 'PENDING_COMPLIANCE_DOCS' || status === 'UNDER_INVESTIGATION';
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
