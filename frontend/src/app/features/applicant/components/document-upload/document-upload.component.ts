import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';

import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  maxFiles: number;
  maxFileSize: number; // in MB
  acceptedTypes: string[];
  documentTypes: string[]; // Backend DocumentType enum values
  icon: string;
}

interface UploadedDocument {
  id: number;
  name: string;
  size: number;
  type: string;
  documentType: string;
  uploadedAt: Date;
  url?: string;
  progress?: number;
  uploading?: boolean;
  error?: string;
}

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css'
})
export class DocumentUploadComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  applicationId = signal<string>('');
  employmentType = signal<string>('');
  
  // Upload state
  uploadedDocuments = signal<UploadedDocument[]>([]);
  isLoading = signal<boolean>(false);
  dragOver = signal<boolean>(false);
  
  // Categories based on employment type
  documentCategories = computed<DocumentCategory[]>(() => {
    const empType = this.employmentType();
    return this.getDocumentCategories(empType);
  });

  // Progress tracking
  uploadProgress = signal<number>(0);
  totalDocumentsRequired = computed(() => {
    return this.documentCategories().filter(cat => cat.required).length;
  });
  
  documentsUploaded = computed(() => {
    return this.uploadedDocuments().length;
  });
  
  isComplete = computed(() => {
    const required = this.documentCategories().filter(cat => cat.required);
    const uploaded = this.uploadedDocuments();
    
    return required.every(cat => 
      uploaded.some(doc => cat.documentTypes.includes(doc.documentType))
    );
  });

  ngOnInit(): void {
    this.applicationId.set(this.route.snapshot.queryParams['applicationId'] || '');
    this.employmentType.set(this.route.snapshot.queryParams['employmentType'] || 'SALARIED');
    
    if (!this.applicationId()) {
      this.notificationService.error('Error', 'Application ID not found');
      this.router.navigate(['/applicant/dashboard']);
      return;
    }

    this.loadUploadedDocuments();
  }

  /**
   * Get document categories based on employment type
   */
  private getDocumentCategories(employmentType: string): DocumentCategory[] {
    const baseCategories: DocumentCategory[] = [
      {
        id: 'identity',
        name: 'Identity Proof',
        description: 'Government issued photo ID (Aadhaar, PAN, Passport, Driving License)',
        required: true,
        maxFiles: 2,
        maxFileSize: 5, // 5MB
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        documentTypes: ['AADHAAR_CARD', 'PAN_CARD', 'PASSPORT', 'DRIVING_LICENSE'],
        icon: '🆔'
      },
      {
        id: 'address',
        name: 'Address Proof',
        description: 'Utility bill, bank statement, or rental agreement (not older than 3 months)',
        required: true,
        maxFiles: 1,
        maxFileSize: 5, // 5MB
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        documentTypes: ['UTILITY_BILL', 'RENTAL_AGREEMENT', 'PROPERTY_DOCUMENTS'],
        icon: '🏠'
      },
      {
        id: 'photograph',
        name: 'Photograph',
        description: 'Recent passport-size photograph',
        required: true,
        maxFiles: 1,
        maxFileSize: 2, // 2MB for photos
        acceptedTypes: ['image/jpeg', 'image/png'],
        documentTypes: ['PHOTOGRAPH'],
        icon: '📷'
      }
    ];

    if (employmentType === 'SALARIED') {
      return [
        ...baseCategories,
        {
          id: 'salary',
          name: 'Salary Slips',
          description: 'Last 3 months salary slips',
          required: true,
          maxFiles: 3,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          documentTypes: ['SALARY_SLIP'],
          icon: '💰'
        },
        {
          id: 'employment',
          name: 'Employment Proof',
          description: 'Appointment/Employment Letter',
          required: true,
          maxFiles: 1,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          documentTypes: ['APPOINTMENT_LETTER', 'EMPLOYMENT_CERTIFICATE'],
          icon: '📄'
        },
        {
          id: 'bank',
          name: 'Bank Statement',
          description: 'Last 6 months bank statement',
          required: true,
          maxFiles: 1,
          maxFileSize: 10, // 10MB for bank statements
          acceptedTypes: ['application/pdf'],
          documentTypes: ['BANK_STATEMENT'],
          icon: '🏦'
        }
      ];
    } else if (employmentType === 'SELF_EMPLOYED') {
      return [
        ...baseCategories,
        {
          id: 'business_reg',
          name: 'Business Registration',
          description: 'Business registration certificate or professional license',
          required: true,
          maxFiles: 1,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          documentTypes: ['BUSINESS_REGISTRATION'],
          icon: '📝'
        },
        {
          id: 'gst',
          name: 'GST Certificate',
          description: 'GST registration certificate (if applicable)',
          required: false,
          maxFiles: 1,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          documentTypes: ['GST_CERTIFICATE'],
          icon: '📋'
        },
        {
          id: 'itr',
          name: 'Income Tax Returns',
          description: 'ITR for last 2 years',
          required: true,
          maxFiles: 2,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf'],
          documentTypes: ['BUSINESS_ITR', 'ITR_FORM'],
          icon: '📊'
        },
        {
          id: 'business_bank',
          name: 'Business Bank Statement',
          description: 'Last 12 months business bank statement',
          required: true,
          maxFiles: 1,
          maxFileSize: 10, // 10MB for bank statements
          acceptedTypes: ['application/pdf'],
          documentTypes: ['BUSINESS_BANK_STATEMENT'],
          icon: '🏦'
        }
      ];
    } else if (employmentType === 'BUSINESS_OWNER') {
      return [
        ...baseCategories,
        {
          id: 'company_pan',
          name: 'Company PAN Card',
          description: 'PAN Card of the company',
          required: true,
          maxFiles: 1,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          documentTypes: ['PAN_CARD'],
          icon: '🏢'
        },
        {
          id: 'business_reg',
          name: 'Business Registration',
          description: 'Company registration certificate (ROC)',
          required: true,
          maxFiles: 1,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf'],
          documentTypes: ['BUSINESS_REGISTRATION'],
          icon: '📝'
        },
        {
          id: 'gst',
          name: 'GST Certificate',
          description: 'GST registration certificate',
          required: true,
          maxFiles: 1,
          maxFileSize: 5, // 5MB
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          documentTypes: ['GST_CERTIFICATE'],
          icon: '📋'
        },
        {
          id: 'financials',
          name: 'Financial Statements',
          description: 'Audited financials (last 2-3 years) or Profit & Loss, Balance Sheet',
          required: true,
          maxFiles: 3,
          maxFileSize: 10, // 10MB for financial documents
          acceptedTypes: ['application/pdf'],
          documentTypes: ['FINANCIAL_STATEMENT', 'PROFIT_LOSS_STATEMENT', 'BALANCE_SHEET'],
          icon: '📈'
        },
        {
          id: 'itr',
          name: 'Income Tax Returns',
          description: 'Company ITR for last 2-3 years',
          required: true,
          maxFiles: 3,
          maxFileSize: 10, // 10MB for ITR documents
          acceptedTypes: ['application/pdf'],
          documentTypes: ['BUSINESS_ITR', 'ITR_FORM'],
          icon: '📊'
        },
        {
          id: 'business_bank',
          name: 'Business Bank Statement',
          description: 'Last 12 months business bank statement',
          required: true,
          maxFiles: 1,
          maxFileSize: 10, // 10MB for bank statements
          acceptedTypes: ['application/pdf'],
          documentTypes: ['BUSINESS_BANK_STATEMENT'],
          icon: '🏦'
        }
      ];
    }

    return baseCategories;
  }

  /**
   * Load already uploaded documents
   */
  private loadUploadedDocuments(): void {
    const appId = this.applicationId();
    if (!appId) return;

    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/loan-application/${appId}/documents`,
      { headers }
    ).subscribe({
      next: (documents) => {
        const uploadedDocs: UploadedDocument[] = documents.map(doc => ({
          id: doc.id, // Use real database ID
          name: doc.fileName,
          size: doc.fileSize,
          type: doc.fileType || 'application/pdf',
          documentType: doc.documentType,
          uploadedAt: new Date(doc.uploadedAt),
          uploading: false,
          progress: 100
        }));
        this.uploadedDocuments.set(uploadedDocs);
      },
      error: (error) => {
        console.error('Failed to load uploaded documents:', error);
        this.uploadedDocuments.set([]);
      }
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event, category: DocumentCategory): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files), category);
    }
  }

  /**
   * Handle drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  /**
   * Handle drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  /**
   * Handle drop
   */
  onDrop(event: DragEvent, category: DocumentCategory): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFiles(Array.from(event.dataTransfer.files), category);
    }
  }

  /**
   * Handle files
   */
  private handleFiles(files: File[], category: DocumentCategory): void {
    // Validate file count
    const currentCount = this.uploadedDocuments().filter(doc => 
      category.documentTypes.includes(doc.documentType)
    ).length;

    if (currentCount + files.length > category.maxFiles) {
      this.notificationService.warning(
        'Too Many Files',
        `Maximum ${category.maxFiles} file(s) allowed for ${category.name}`
      );
      return;
    }

    // Validate and upload each file
    files.forEach(file => {
      if (this.validateFile(file, category)) {
        this.uploadFile(file, category);
      }
    });
  }

  /**
   * Validate file
   */
  private validateFile(file: File, category: DocumentCategory): boolean {
    // Check file type
    if (!category.acceptedTypes.includes(file.type)) {
      this.notificationService.error(
        'Invalid File Type',
        `${file.name} is not a valid file type. Accepted: ${category.acceptedTypes.join(', ')}`
      );
      return false;
    }

    // Check file size using category maxFileSize
    const maxSize = category.maxFileSize * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      this.notificationService.error(
        'File Too Large',
        `${file.name} exceeds ${category.maxFileSize}MB limit`
      );
      return false;
    }

    return true;
  }

  /**
   * Upload file to backend
   */
  private uploadFile(file: File, category: DocumentCategory): void {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', category.documentTypes[0]); // Use first document type

    const tempDoc: UploadedDocument = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      documentType: category.documentTypes[0],
      uploadedAt: new Date(),
      progress: 0,
      uploading: true
    };

    // Add to uploaded documents with uploading state
    this.uploadedDocuments.update(docs => [...docs, tempDoc]);

    // Upload to backend
    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/documents/upload`,
      formData,
      { headers, reportProgress: true, observe: 'events' }
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          this.updateDocumentProgress(tempDoc.id, progress);
        } else if (event.type === HttpEventType.Response) {
          const response = event.body;
          this.updateDocumentComplete(tempDoc.id, response.documentId);
          this.notificationService.success('Success', `${file.name} uploaded successfully`);
        }
      },
      error: (error) => {
        this.updateDocumentError(tempDoc.id, error.error?.message || 'Upload failed');
        this.notificationService.error('Upload Failed', error.error?.message || 'Failed to upload document');
      }
    });
  }

  /**
   * Update document upload progress
   */
  private updateDocumentProgress(tempId: number, progress: number): void {
    this.uploadedDocuments.update(docs =>
      docs.map(doc => doc.id === tempId ? { ...doc, progress } : doc)
    );
  }

  /**
   * Update document as complete
   */
  private updateDocumentComplete(tempId: number, documentId: number): void {
    this.uploadedDocuments.update(docs =>
      docs.map(doc => doc.id === tempId ? { ...doc, id: documentId, uploading: false, progress: 100 } : doc)
    );
  }

  /**
   * Update document with error
   */
  private updateDocumentError(tempId: number, error: string): void {
    this.uploadedDocuments.update(docs =>
      docs.map(doc => doc.id === tempId ? { ...doc, uploading: false, error } : doc)
    );
  }

  /**
   * Delete uploaded document
   */
  deleteDocument(doc: UploadedDocument): void {
    if (!confirm(`Are you sure you want to delete ${doc.name}?`)) {
      return;
    }

    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/documents/${doc.id}`,
      { headers }
    ).subscribe({
      next: () => {
        this.uploadedDocuments.update(docs => docs.filter(d => d.id !== doc.id));
        this.notificationService.success('Deleted', `${doc.name} deleted successfully`);
      },
      error: (error) => {
        this.notificationService.error('Delete Failed', error.error?.message || 'Failed to delete document');
      }
    });
  }

  /**
   * Get documents for a category
   */
  getCategoryDocuments(category: DocumentCategory): UploadedDocument[] {
    return this.uploadedDocuments().filter(doc => 
      category.documentTypes.includes(doc.documentType)
    );
  }

  /**
   * Get user-friendly display of accepted file types
   */
  getAcceptedTypesDisplay(acceptedTypes: string[]): string {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/jpg': 'JPG'
    };
    
    return acceptedTypes.map(type => typeMap[type] || type).join(', ');
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Submit and continue to application summary
   */
  submitAndContinue(): void {
    if (!this.isComplete()) {
      this.notificationService.warning('Incomplete', 'Please upload all required documents');
      return;
    }

    this.notificationService.success('Success', 'All documents uploaded! Proceeding to application summary...');
    
    // Navigate to application summary for final review
    this.router.navigate(['/applicant/application-summary'], {
      queryParams: {
        applicationId: this.applicationId(),
        employmentType: this.employmentType()
      }
    });
  }

  /**
   * Save and exit
   */
  saveAndExit(): void {
    this.notificationService.info('Saved', 'Your progress has been saved');
    this.router.navigate(['/applicant/dashboard']);
  }

  /**
   * Navigate back to previous step
   */
  goBack(): void {
    this.router.navigate(['/applicant/employment-details'], {
      queryParams: {
        applicationId: this.applicationId(),
        employmentType: this.employmentType()
      }
    });
  }
}
