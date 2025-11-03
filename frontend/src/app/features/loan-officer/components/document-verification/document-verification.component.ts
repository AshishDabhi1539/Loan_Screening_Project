import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, CompleteApplicationDetailsResponse, DocumentVerificationRequest } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-document-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './document-verification.component.html',
  styleUrl: './document-verification.component.css'
})
export class DocumentVerificationComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isSubmittingResubmission = signal(false);
  showResubmissionDialog = signal(false);
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  
  resubmissionInstructions = '';
  resubmissionDueDate = '';
  
  // New form structure: Category-based verification
  verificationForm: FormGroup = this.fb.group({
    // Identity Verification
    identityVerified: [null],
    identityNotes: ['', [Validators.maxLength(500)]],
    
    // Employment Verification
    employmentVerified: [null],
    employmentNotes: ['', [Validators.maxLength(500)]],
    
    // Income Verification
    incomeVerified: [null],
    incomeNotes: ['', [Validators.maxLength(500)]],
    
    // Bank Verification
    bankVerified: [null],
    bankNotes: ['', [Validators.maxLength(500)]],
    
    // Address Verification
    addressVerified: [null],
    addressNotes: ['', [Validators.maxLength(500)]],
    
    // General notes
    generalNotes: ['', [Validators.maxLength(1000)]],
    
    // Documents
    documents: this.fb.array([])
  });

  ngOnInit(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (applicationId) {
      this.loadApplicationDetails(applicationId);
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  get documentsFormArray(): FormArray {
    return this.verificationForm.get('documents') as FormArray;
  }

  initializeDocumentForms(): void {
    const documents = this.applicationDetails()?.documents || [];
    const documentsArray = this.verificationForm.get('documents') as FormArray;
    documentsArray.clear();

    documents.forEach(doc => {
      documentsArray.push(this.fb.group({
        documentId: [doc.documentId],
        documentType: [doc.documentType],
        fileName: [doc.fileName],
        rejected: [false],
        rejectionReason: ['']
      }));
    });
  }

  getDocumentControl(index: number, field: string): FormControl {
    return this.documentsFormArray.at(index).get(field) as FormControl;
  }

  getDocumentFormIndex(documentId: number): number {
    return this.documentsFormArray.controls.findIndex(
      control => control.get('documentId')?.value === documentId
    );
  }

  /**
   * Load application details
   */
  private loadApplicationDetails(applicationId: string): void {
    this.isLoading.set(true);
    this.loanOfficerService.getCompleteApplicationDetails(applicationId).subscribe({
      next: (details) => {
        this.applicationDetails.set(details);
        this.initializeDocumentForms();
        
        // Only start verification if not already started
        const currentStatus = details.applicationInfo?.status;
        if (currentStatus !== 'DOCUMENT_VERIFICATION' && currentStatus !== 'DOCUMENT_VERIFIED') {
          this.startVerification(applicationId);
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading application details:', error);
        this.notificationService.error(
          'Error Loading Application',
          'Failed to load application details.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * PHASE 2: Helper methods to group documents and extract applicant data
   * SMART FILTERING: Shows only relevant documents based on employment type
   */
  
  // Get documents by category - using computed signals to prevent excessive re-computation
  identityDocuments = computed(() => {
    const identityTypes = ['AADHAAR_CARD', 'PAN_CARD', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE', 'PHOTOGRAPH'];
    return this.applicationDetails()?.documents.filter(doc => identityTypes.includes(doc.documentType) && !this.isComplianceOnlyDoc(doc)) || [];
  });

  // Keep the old method for backward compatibility, but use the computed signal
  getIdentityDocuments() {
    return this.identityDocuments();
  }

  getEmploymentDocuments(): any[] {
    // Comprehensive list of ALL employment-related document types
    const allEmploymentTypes = [
      // Salaried
      'EMPLOYMENT_LETTER', 'APPOINTMENT_LETTER', 'OFFER_LETTER', 'EXPERIENCE_LETTER',
      // Self-Employed/Business
      'BUSINESS_REGISTRATION', 'GST_CERTIFICATE', 'SHOP_ESTABLISHMENT_LICENSE', 'TRADE_LICENSE',
      // Professional
      'PROFESSIONAL_LICENSE', 'PRACTICE_CERTIFICATE', 'REGISTRATION_CERTIFICATE',
      // Freelancer
      'CLIENT_CONTRACTS', 'WORK_PORTFOLIO', 'FREELANCE_AGREEMENTS',
      // Retired
      'PENSION_CERTIFICATE', 'RETIREMENT_LETTER', 'PPO',
      // Student
      'STUDENT_ID', 'ENROLLMENT_CERTIFICATE', 'GUARDIAN_DOCUMENTS',
      // Other
      'COMPANY_ID', 'PAYSLIP', 'EMPLOYMENT_PROOF'
    ];

    return this.applicationDetails()?.documents.filter(doc => 
      allEmploymentTypes.includes(doc.documentType) && !this.isComplianceOnlyDoc(doc)
    ) || [];
  }

  getIncomeDocuments(): any[] {
    // Comprehensive list of ALL income-related document types
    const allIncomeTypes = [
      // Salaried
      'SALARY_SLIP', 'FORM_16', 'PAYSLIP',
      // Business/Self-Employed
      'ITR', 'FINANCIAL_STATEMENT', 'PROFIT_LOSS_STATEMENT', 'BALANCE_SHEET',
      // Professional
      'PROFESSIONAL_TAX_RECEIPT', 'INCOME_CERTIFICATE',
      // Freelancer
      'INVOICE_RECEIPTS', 'CLIENT_PAYMENT_PROOF',
      // Retired
      'PENSION_SLIP',
      // Student/Unemployed
      'GUARDIAN_INCOME_PROOF', 'SCHOLARSHIP_CERTIFICATE', 'SAVINGS_PROOF', 'INVESTMENT_STATEMENTS',
      // Other
      'INCOME_TAX_RETURN', 'INCOME_PROOF'
    ];

    return this.applicationDetails()?.documents.filter(doc => 
      allIncomeTypes.includes(doc.documentType) && !this.isComplianceOnlyDoc(doc)
    ) || [];
  }

  getBankDocuments(): any[] {
    const bankTypes = [
      'BANK_STATEMENT', 
      'CANCELLED_CHEQUE', 
      'PASSBOOK_COPY',
      'BANK_ACCOUNT_PROOF',
      'CHEQUE_BOOK_COPY'
    ];
    return this.applicationDetails()?.documents.filter(doc => bankTypes.includes(doc.documentType) && !this.isComplianceOnlyDoc(doc)) || [];
  }

  getAddressDocuments(): any[] {
    const addressTypes = [
      'UTILITY_BILL', 
      'RENTAL_AGREEMENT', 
      'PROPERTY_TAX_RECEIPT', 
      'RATION_CARD',
      'ELECTRICITY_BILL',
      'WATER_BILL',
      'GAS_BILL',
      'TELEPHONE_BILL',
      'LEASE_AGREEMENT',
      'PROPERTY_DEED',
      'ADDRESS_PROOF'
    ];
    return this.applicationDetails()?.documents.filter(doc => addressTypes.includes(doc.documentType) && !this.isComplianceOnlyDoc(doc)) || [];
  }

  // Helper to check if category has documents
  hasIdentityDocuments(): boolean {
    return this.getIdentityDocuments().length > 0;
  }

  hasEmploymentDocuments(): boolean {
    return this.getEmploymentDocuments().length > 0;
  }

  hasIncomeDocuments(): boolean {
    return this.getIncomeDocuments().length > 0;
  }

  hasBankDocuments(): boolean {
    return this.getBankDocuments().length > 0;
  }

  hasAddressDocuments(): boolean {
    return this.getAddressDocuments().length > 0;
  }

  // Get applicant data for display
  getPersonalDetails() {
    return this.applicationDetails()?.applicantIdentity?.personalDetails;
  }

  getAddressDetails() {
    return this.applicationDetails()?.applicantIdentity?.personalDetails?.addresses;
  }

  getEmploymentDetails() {
    return this.applicationDetails()?.employmentDetails;
  }

  getIncomeDetails() {
    const employment = this.applicationDetails()?.employmentDetails;
    return {
      monthlyIncome: employment?.monthlyIncome,
      annualIncome: employment?.annualIncome,
      employmentType: employment?.employmentType
    };
  }

  getBankDetails() {
    return this.applicationDetails()?.employmentDetails?.bankDetails;
  }

  /**
   * Start document verification process
   */
  private startVerification(applicationId: string): void {
    this.loanOfficerService.startDocumentVerification(applicationId).subscribe({
      next: () => {
        // Verification started
      },
      error: (error) => {
        console.error('Error starting verification:', error);
      }
    });
  }

  /**
   * Helper to view document
   */
  viewDocument(fileUrl: string): void {
    window.open(fileUrl, '_blank');
  }

  /**
   * Download document using fetch and blob (proper download)
   */
  downloadDocument(fileUrl: string, fileName?: string): void {
    this.notificationService.info('Download Started', `Downloading ${fileName || 'document'}...`);
    
    // Fetch the file as blob
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'document.pdf';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        this.notificationService.success('Download Complete', `${fileName || 'Document'} downloaded successfully`);
      })
      .catch(error => {
        console.error('Download error:', error);
        this.notificationService.error('Download Failed', 'Failed to download document. Opening in new tab instead.');
        window.open(fileUrl, '_blank');
      });
  }

  /**
   * OLD TEMPLATE COMPATIBILITY METHODS
   * These are needed by the current HTML template
   */
  verifiedCount(): number {
    return 0; // Will be replaced when new template is implemented
  }

  rejectedCount(): number {
    return 0; // Will be replaced when new template is implemented
  }

  isDocumentVerified(index: number): boolean {
    return false; // Will be replaced when new template is implemented
  }

  isDocumentRejected(index: number): boolean {
    return false; // Will be replaced when new template is implemented
  }

  setDocumentStatus(index: number, status: 'verified' | 'rejected'): void {
    // Will be replaced when new template is implemented
  }

  /**
   * PHASE 4: Submit verification - NEW CATEGORY-BASED LOGIC
   */
  submitVerification(): void {
    console.log('=== Submit Verification Called ===');
    console.log('Form Valid:', this.verificationForm.valid);
    console.log('Form Value:', this.verificationForm.value);
    
    const formValue = this.verificationForm.value;
    
    // Validate only categories that have documents
    const errors: string[] = [];
    
    if (this.hasIdentityDocuments() && formValue.identityVerified === null) {
      errors.push('Identity verification decision is required');
    }
    if (this.hasEmploymentDocuments() && formValue.employmentVerified === null) {
      errors.push('Employment verification decision is required');
    }
    if (this.hasIncomeDocuments() && formValue.incomeVerified === null) {
      errors.push('Income verification decision is required');
    }
    if (this.hasBankDocuments() && formValue.bankVerified === null) {
      errors.push('Bank verification decision is required');
    }
    if (this.hasAddressDocuments() && formValue.addressVerified === null) {
      errors.push('Address verification decision is required');
    }
    
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      this.notificationService.error(
        'Validation Error',
        errors.join(', ')
      );
      return;
    }

    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (!appId) {
      console.log('No application ID found!');
      return;
    }

    this.isSubmitting.set(true);
    const documents = this.applicationDetails()?.documents || [];

    // Build document verifications - mark ALL documents as verified/rejected based on their category
    const documentVerifications: {
      documentId: string;
      verified: boolean;
      verificationNotes?: string;
      rejectionReason?: string;
    }[] = [];

    // Process each document based on its category verification status
    // Use the same smart filtering logic as the helper methods
    const identityDocs = this.getIdentityDocuments().map(d => d.documentId);
    const employmentDocs = this.getEmploymentDocuments().map(d => d.documentId);
    const incomeDocs = this.getIncomeDocuments().map(d => d.documentId);
    const bankDocs = this.getBankDocuments().map(d => d.documentId);
    const addressDocs = this.getAddressDocuments().map(d => d.documentId);

    documents.forEach(doc => {
      let verified = false;
      let notes = '';

      // Determine verification status based on document category
      if (identityDocs.includes(doc.documentId)) {
        verified = formValue.identityVerified === true;
        notes = formValue.identityNotes || 'Identity verification';
      } else if (employmentDocs.includes(doc.documentId)) {
        verified = formValue.employmentVerified === true;
        notes = formValue.employmentNotes || 'Employment verification';
      } else if (incomeDocs.includes(doc.documentId)) {
        verified = formValue.incomeVerified === true;
        notes = formValue.incomeNotes || 'Income verification';
      } else if (bankDocs.includes(doc.documentId)) {
        verified = formValue.bankVerified === true;
        notes = formValue.bankNotes || 'Bank verification';
      } else if (addressDocs.includes(doc.documentId)) {
        verified = formValue.addressVerified === true;
        notes = formValue.addressNotes || 'Address verification';
      }

      documentVerifications.push({
        documentId: doc.documentId.toString(),
        verified,
        verificationNotes: verified ? notes : undefined,
        rejectionReason: verified ? undefined : notes
      });
    });

    // Check if any documents are rejected
    const rejectedDocs = formValue.documents.filter((doc: any) => doc.rejected);
    const hasRejections = rejectedDocs.length > 0;

    // Calculate overall verification status
    const identityVerified = formValue.identityVerified === true;
    const employmentVerified = formValue.employmentVerified === true;
    const incomeVerified = formValue.incomeVerified === true;
    const bankVerified = formValue.bankVerified === true;
    const addressVerified = formValue.addressVerified === true;

    // Overall passes only if all categories verified AND no document rejections
    const overallPassed = identityVerified && employmentVerified && 
                         incomeVerified && bankVerified && addressVerified && !hasRejections;

    // Build request
    const request: DocumentVerificationRequest = {
      documentVerifications,
      identityVerified,
      identityVerificationNotes: formValue.identityNotes || 'Identity verification completed',
      employmentVerified,
      employmentVerificationNotes: formValue.employmentNotes || 'Employment verification completed',
      incomeVerified,
      incomeVerificationNotes: formValue.incomeNotes || 'Income verification completed',
      bankAccountVerified: bankVerified,
      bankAccountVerificationNotes: formValue.bankNotes || 'Bank verification completed',
      addressVerified,
      overallVerificationPassed: overallPassed,
      generalNotes: formValue.generalNotes || 'Document verification completed'
    };

    console.log('=== NEW Category-Based Verification ===');
    console.log('Request:', JSON.stringify(request, null, 2));

    this.loanOfficerService.verifyDocuments(appId, request).subscribe({
      next: () => {
        this.notificationService.success(
          'Verification Complete',
          'Document verification has been completed successfully.'
        );
        this.isSubmitting.set(false);
        // Navigate back to Review Workflow page
        this.router.navigate(['/loan-officer/application', appId, 'review']);
      },
      error: (error) => {
        console.error('Verification error:', error);
        this.notificationService.error(
          'Verification Failed',
          error.error?.message || 'Failed to complete document verification.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get total number of categories available for verification
   */
  getTotalCategoriesCount(): number {
    let count = 0;
    if (this.hasIdentityDocuments()) count++;
    if (this.hasEmploymentDocuments()) count++;
    if (this.hasIncomeDocuments()) count++;
    if (this.hasBankDocuments()) count++;
    if (this.hasAddressDocuments()) count++;
    return count;
  }

  /**
   * Get number of completed categories
   */
  getCompletedCategoriesCount(): number {
    const form = this.verificationForm.value;
    let count = 0;
    
    if (this.hasIdentityDocuments() && form.identityVerified !== null) count++;
    if (this.hasEmploymentDocuments() && form.employmentVerified !== null) count++;
    if (this.hasIncomeDocuments() && form.incomeVerified !== null) count++;
    if (this.hasBankDocuments() && form.bankVerified !== null) count++;
    if (this.hasAddressDocuments() && form.addressVerified !== null) count++;
    
    return count;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    const total = this.getTotalCategoriesCount();
    if (total === 0) return 0;
    const completed = this.getCompletedCategoriesCount();
    return Math.round((completed / total) * 100);
  }

  /**
   * Check if form is valid (all available categories have decisions)
   */
  isFormValid(): boolean {
    const form = this.verificationForm.value;
    
    // Check each available category
    if (this.hasIdentityDocuments() && form.identityVerified === null) return false;
    if (this.hasEmploymentDocuments() && form.employmentVerified === null) return false;
    if (this.hasIncomeDocuments() && form.incomeVerified === null) return false;
    if (this.hasBankDocuments() && form.bankVerified === null) return false;
    if (this.hasAddressDocuments() && form.addressVerified === null) return false;
    
    return true;
  }

  /**
   * Get list of missing categories
   */
  getMissingCategories(): string[] {
    const form = this.verificationForm.value;
    const missing: string[] = [];
    
    if (this.hasIdentityDocuments() && form.identityVerified === null) missing.push('Identity');
    if (this.hasEmploymentDocuments() && form.employmentVerified === null) missing.push('Employment');
    if (this.hasIncomeDocuments() && form.incomeVerified === null) missing.push('Income');
    if (this.hasBankDocuments() && form.bankVerified === null) missing.push('Bank');
    if (this.hasAddressDocuments() && form.addressVerified === null) missing.push('Address');
    
    return missing;
  }

  /**
   * Hide compliance-only documents from loan officer views
   */
  private isComplianceOnlyDoc(doc: any): boolean {
    try {
      if (!doc) return false;
      if (doc.tags && Array.isArray(doc.tags) && doc.tags.includes('COMPLIANCE_ONLY')) return true;
      if (doc.meta && (doc.meta.requestedBy === 'COMPLIANCE' || doc.meta.visibility === 'COMPLIANCE_ONLY')) return true;
      if (typeof doc.additionalInstructions === 'string' && doc.additionalInstructions.includes('[COMPLIANCE_ONLY]')) return true;
      if (typeof doc.notes === 'string' && doc.notes.includes('[COMPLIANCE_ONLY]')) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Cancel verification - navigate back to Review page
   */
  cancel(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      // Navigate back to Review Workflow page (Step 2 - Documents)
      this.router.navigate(['/loan-officer/application', appId, 'review']);
    } else {
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Get verified document control
   */
  getVerifiedDocumentControl(index: number): FormControl {
    const verifiedArray = this.verificationForm.get('verifiedDocuments') as FormArray;
    return verifiedArray.at(index) as FormControl;
  }

  /**
   * Get rejection reason control
   */
  getRejectionReasonControl(index: number): FormControl {
    const rejectedArray = this.verificationForm.get('rejectedDocuments') as FormArray;
    const rejectedGroup = rejectedArray.at(index) as FormGroup;
    return rejectedGroup.get('rejectionReason') as FormControl;
  }

  /**
   * Open resubmission dialog
   */
  openResubmissionDialog(): void {
    this.showResubmissionDialog.set(true);
  }

  /**
   * Close resubmission dialog
   */
  closeResubmissionDialog(): void {
    this.showResubmissionDialog.set(false);
    this.resubmissionInstructions = '';
    this.resubmissionDueDate = '';
  }

  /**
   * Get rejected documents with reasons
   */
  getRejectedDocuments(): { documentType: string; reason: string }[] {
    const rejectedArray = this.verificationForm.get('rejectedDocuments') as FormArray;
    const documents = this.applicationDetails()?.documents || [];
    const rejected: { documentType: string; reason: string }[] = [];

    rejectedArray.controls.forEach((control, index) => {
      const reason = control.get('rejectionReason')?.value;
      if (reason && reason.trim().length > 0) {
        rejected.push({
          documentType: documents[index].documentType,
          reason: reason
        });
      }
    });

    return rejected;
  }

  /**
   * Submit resubmission request
   */
  submitResubmissionRequest(): void {
    // Validate instructions
    if (!this.resubmissionInstructions || this.resubmissionInstructions.trim().length === 0) {
      this.notificationService.error('Validation Error', 'Please provide resubmission instructions.');
      return;
    }

    // Validate due date
    if (!this.resubmissionDueDate) {
      this.notificationService.error('Validation Error', 'Please select a due date.');
      return;
    }

    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (!appId) {
      this.notificationService.error('Error', 'Application ID not found.');
      return;
    }

    this.isSubmittingResubmission.set(true);

    const rejectedDocs = this.getRejectedDocuments();
    
    if (rejectedDocs.length === 0) {
      this.notificationService.error('Validation Error', 'No rejected documents found.');
      this.isSubmittingResubmission.set(false);
      return;
    }

    // Convert date to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
    const dueDateWithTime = `${this.resubmissionDueDate}T23:59:59`;

    // Build request matching backend DTO structure
    const request = {
      rejectedDocuments: rejectedDocs.map(doc => ({
        documentType: doc.documentType,
        rejectionReason: doc.reason,
        requiredAction: 'REUPLOAD',
        specificInstructions: this.resubmissionInstructions,
        isRequired: true
      })),
      resubmissionDeadline: dueDateWithTime,
      additionalInstructions: this.resubmissionInstructions,
      officerNotes: this.verificationForm.get('verificationNotes')?.value || ''
    };

    console.log('Submitting resubmission request:', request);

    this.loanOfficerService.requestDocumentResubmission(appId, request).subscribe({
      next: (response) => {
        console.log('Resubmission response:', response);
        this.notificationService.success(
          'Resubmission Requested',
          'Document reupload request has been sent to the applicant.'
        );
        this.closeResubmissionDialog();
        this.isSubmittingResubmission.set(false);
        // Navigate back to Review Workflow page
        this.router.navigate(['/loan-officer/application', appId, 'review']);
      },
      error: (error) => {
        console.error('Error requesting resubmission:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to send resubmission request.';
        this.notificationService.error(
          'Request Failed',
          errorMessage
        );
        this.isSubmittingResubmission.set(false);
      }
    });
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
