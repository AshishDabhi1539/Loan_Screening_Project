import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { ResubmissionRequirementsResponse, DocumentRequirement } from '../../../../core/models/loan-application.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-document-resubmission',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-resubmission.component.html',
  styleUrls: ['./document-resubmission.component.css']
})
export class DocumentResubmissionComponent implements OnInit {
  applicationId = signal<string>('');
  requirements = signal<ResubmissionRequirementsResponse | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  selectedFiles = signal<Map<string, File>>(new Map());

  // Computed properties
  rejectedDocuments = computed(() => {
    return this.requirements()?.documentRequirements.filter(doc => 
      doc.currentStatus === 'REJECTED'
    ) || [];
  });

  missingDocuments = computed(() => {
    return this.requirements()?.documentRequirements.filter(doc => 
      doc.currentStatus === 'MISSING'
    ) || [];
  });

  verifiedDocuments = computed(() => {
    return this.requirements()?.documentRequirements.filter(doc => 
      doc.currentStatus === 'VERIFIED'
    ) || [];
  });

  pendingDocuments = computed(() => {
    return this.requirements()?.documentRequirements.filter(doc => 
      doc.currentStatus === 'PENDING'
    ) || [];
  });

  canSubmit = computed(() => {
    const rejected = this.rejectedDocuments();
    const missing = this.missingDocuments();
    const totalRequired = rejected.length + missing.length;
    const uploaded = this.selectedFiles().size;
    
    // Can submit if at least one document has been uploaded
    return uploaded > 0 && !this.isSubmitting();
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanApplicationService: LoanApplicationService,
    private notificationService: NotificationService,
    private titleService: Title
  ) {
    // Set initial page title
    this.titleService.setTitle('Document Resubmission - Loan Application');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const appId = params['id'];
      if (appId) {
        this.applicationId.set(appId);
        this.loadResubmissionRequirements();
      }
    });
  }

  loadResubmissionRequirements(): void {
    this.isLoading.set(true);
    this.loanApplicationService.getResubmissionRequirements(this.applicationId()).subscribe({
      next: (requirements) => {
        this.requirements.set(requirements);
        this.isLoading.set(false);
        
        // Update page title with application info
        const appIdShort = this.applicationId().substring(0, 8);
        this.titleService.setTitle(`Document Resubmission - App ${appIdShort}`);
        
        if (!requirements.hasResubmissionRequirements) {
          this.notificationService.info(
            'No Resubmission Required',
            'All documents are verified. No resubmission needed.'
          );
          this.router.navigate(['/applicant/dashboard']);
        }
      },
      error: (error) => {
        console.error('Error loading resubmission requirements:', error);
        this.notificationService.error(
          'Error',
          'Failed to load resubmission requirements'
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

  async submitResubmission(): Promise<void> {
    if (!this.canSubmit()) {
      this.notificationService.warning(
        'No Documents Selected',
        'Please upload at least one document before submitting'
      );
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Upload all selected files
      const uploadPromises: Promise<any>[] = [];
      this.selectedFiles().forEach((file, documentType) => {
        const uploadPromise = this.loanApplicationService
          .uploadDocument(this.applicationId(), file, documentType)
          .toPromise();
        uploadPromises.push(uploadPromise);
      });

      await Promise.all(uploadPromises);

      // Mark documents as resubmitted
      await this.loanApplicationService
        .markDocumentsResubmitted(this.applicationId())
        .toPromise();

      this.notificationService.success(
        'Documents Resubmitted Successfully',
        'Your documents have been resubmitted for review. You will be notified once the review is complete.'
      );

      // Navigate back to dashboard
      this.router.navigate(['/applicant/dashboard']);
    } catch (error: any) {
      console.error('Error submitting resubmission:', error);
      this.notificationService.error(
        'Submission Failed',
        error.error?.message || 'Failed to submit documents. Please try again.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  getDocumentTypeName(documentType: string): string {
    return documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'MISSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
