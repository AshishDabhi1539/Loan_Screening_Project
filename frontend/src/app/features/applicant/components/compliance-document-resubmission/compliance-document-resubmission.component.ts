import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';

interface ComplianceDocumentRequirement {
  documentType: string;
  documentTypeName: string;
  requestReason?: string;
  additionalInstructions?: string;
  deadline?: string;
  isMandatory: boolean;
  priorityLevel?: string;
}

@Component({
  selector: 'app-compliance-document-resubmission',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compliance-document-resubmission.component.html',
  styleUrls: ['./compliance-document-resubmission.component.css']
})
export class ComplianceDocumentResubmissionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loanApplicationService = inject(LoanApplicationService);
  private notificationService = inject(NotificationService);
  private titleService = inject(Title);
  private apiService = inject(ApiService);

  applicationId = signal<string>('');
  applicationStatus = signal<string>('');
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  selectedFiles = signal<Map<string, File>>(new Map());
  requirements = signal<ComplianceDocumentRequirement[]>([]);
  requestDetails = signal<{
    requestReason?: string;
    additionalInstructions?: string;
    deadline?: string;
  } | null>(null);

  // Computed properties
  canSubmit = computed(() => {
    const uploaded = this.selectedFiles().size;
    const required = this.requirements().filter(r => r.isMandatory).length;
    // Can submit if at least all mandatory documents are uploaded, or at least one document is uploaded
    return uploaded >= Math.max(1, required) && !this.isSubmitting();
  });

  /**
   * Whether current requirements include any mandatory items
   * Defined as a method so the template avoids arrow functions (not supported there)
   */
  hasMandatoryRequirements(): boolean {
    const reqs = this.requirements();
    if (!Array.isArray(reqs)) {
      return false;
    }
    return reqs.some(req => !!req.isMandatory);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const appId = params['id'];
      if (appId) {
        this.applicationId.set(appId);
        this.loadComplianceRequirements();
      }
    });
  }

  loadComplianceRequirements(): void {
    this.isLoading.set(true);
    
    // First, get application details to check status and get compliance notes
    this.loanApplicationService.getApplicationById(this.applicationId()).subscribe({
      next: (application) => {
        this.applicationStatus.set(application.status);
        
        if (application.status !== 'PENDING_COMPLIANCE_DOCS') {
          this.notificationService.warning(
            'Not Applicable',
            'This application is not awaiting compliance documents.'
          );
          this.router.navigate(['/applicant/dashboard']);
          return;
        }

        // Get compliance-specific document requirements from dedicated endpoint
        this.loanApplicationService.getComplianceDocumentRequirements(this.applicationId()).subscribe({
          next: (requirements) => {
            // Map to ComplianceDocumentRequirement
            const mapped: ComplianceDocumentRequirement[] = requirements.documentRequirements.map(doc => ({
              documentType: doc.documentType,
              documentTypeName: doc.documentTypeName || this.getDocumentTypeName(doc.documentType),
              requestReason: doc.rejectionReason || 'Requested by compliance officer',
              additionalInstructions: doc.specificInstructions?.replace('[COMPLIANCE_ONLY]', '').trim() || doc.specificInstructions,
              isMandatory: doc.isRequired !== false,
              priorityLevel: 'HIGH' // Default for compliance requests
            }));
            
            this.requirements.set(mapped);
            this.requestDetails.set({
              requestReason: requirements.additionalInstructions?.replace('[COMPLIANCE_ONLY]', '').trim() || 'Compliance review required',
              additionalInstructions: requirements.additionalInstructions?.replace('[COMPLIANCE_ONLY]', '').trim(),
              deadline: requirements.resubmissionDeadline
            });
            
            if (mapped.length === 0) {
              this.notificationService.warning(
                'No Documents Found',
                'No compliance document requirements found. Please contact support if you believe this is an error.'
              );
            }
            
            this.titleService.setTitle(`Compliance Documents - App ${this.applicationId().substring(0, 8)}`);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading compliance requirements:', error);
            this.notificationService.error(
              'Error',
              error.error?.message || 'Failed to load compliance document requirements'
            );
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.notificationService.error(
          'Error',
          'Failed to load application details'
        );
        this.isLoading.set(false);
      }
    });
  }

  onFileSelected(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error(
          'File Too Large',
          'File size must be less than 5MB'
        );
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.notificationService.error(
          'Invalid File Type',
          'Only JPG, PNG, and PDF files are allowed'
        );
        return;
      }

      // Add to selected files
      const files = new Map(this.selectedFiles());
      files.set(documentType, file);
      this.selectedFiles.set(files);

      this.notificationService.success(
        'File Selected',
        `${file.name} selected for ${this.getDocumentTypeName(documentType)}`
      );
    }
  }

  removeFile(documentType: string): void {
    const files = new Map(this.selectedFiles());
    files.delete(documentType);
    this.selectedFiles.set(files);
  }

  async submitComplianceDocuments(): Promise<void> {
    if (!this.canSubmit()) {
      this.notificationService.warning(
        'No Documents Selected',
        'Please upload at least one document before submitting'
      );
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Upload all selected files with [COMPLIANCE_ONLY] tag
      const uploadPromises: Promise<any>[] = [];
      this.selectedFiles().forEach((file, documentType) => {
        // Upload document with compliance-only marker in additional instructions
        const uploadPromise = this.uploadComplianceDocument(this.applicationId(), file, documentType)
          .toPromise();
        uploadPromises.push(uploadPromise);
      });

      await Promise.all(uploadPromises);

      // Mark documents as submitted in localStorage to remove alert from dashboard
      const submittedKey = `compliance_docs_submitted_${this.applicationId()}`;
      localStorage.setItem(submittedKey, 'true');

      // Notify compliance officer that documents have been submitted
      // The compliance officer will then call /documents-received when they review
      this.notificationService.success(
        'Documents Submitted Successfully',
        'Your compliance documents have been submitted. The compliance officer will review them shortly.'
      );

      // Navigate back to dashboard
      this.router.navigate(['/applicant/dashboard']);
    } catch (error: any) {
      console.error('Error submitting compliance documents:', error);
      this.notificationService.error(
        'Submission Failed',
        error.error?.message || 'Failed to submit documents. Please try again.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Upload document for compliance with [COMPLIANCE_ONLY] tag
   */
  private uploadComplianceDocument(applicationId: string, file: File, documentType: string): any {
    // Use the regular upload endpoint - backend should recognize compliance documents
    // when application status is PENDING_COMPLIANCE_DOCS
    // The document will be tagged as compliance-only based on the application status
    return this.loanApplicationService.uploadDocument(applicationId, file, documentType);
  }

  cancel(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  getDocumentTypeName(documentType: string): string {
    return documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}

