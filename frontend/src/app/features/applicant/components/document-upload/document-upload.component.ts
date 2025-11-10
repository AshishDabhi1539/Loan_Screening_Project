import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';

import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { 
  CategoryRequirement, 
  DocumentRequirement,
  getDocumentRequirements
} from '../../../../core/models/document-requirements.model';

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

  // Application state
  applicationId = signal<string>('');
  employmentType = signal<string>('SALARIED');
  returnUrl = signal<string>(''); // URL to return to after completion
  
  // Upload state
  uploadedDocuments = signal<UploadedDocument[]>([]);
  isLoading = signal<boolean>(false);
  dragOver = signal<boolean>(false);
  
  // Document categories from centralized model
  documentCategories = signal<CategoryRequirement[]>([]);

  // Progress tracking
  totalDocumentsRequired = computed(() => {
    let count = 0;
    this.documentCategories().forEach(cat => {
      count += cat.documents.filter(doc => doc.required).length;
    });
    return count;
  });
  
  documentsUploaded = computed(() => {
    const uploaded = this.uploadedDocuments();
    const required = this.getRequiredDocumentTypes();
    // Only count documents that are fully uploaded (not currently uploading and no errors)
    return uploaded.filter(doc => 
      required.includes(doc.documentType) && 
      !doc.uploading && 
      !doc.error
    ).length;
  });
  
  isComplete = computed(() => {
    const categories = this.documentCategories();
    const uploaded = this.uploadedDocuments();
    
    // Check if all required documents are uploaded AND fully complete
    for (const category of categories) {
      for (const doc of category.documents) {
        if (doc.required) {
          // Check if document is uploaded, not currently uploading, and has no errors
          const isUploaded = uploaded.some(u => 
            u.documentType === doc.documentType && 
            !u.uploading && 
            !u.error
          );
          if (!isUploaded) {
            return false;
          }
        }
      }
    }
    return true;
  });

  ngOnInit(): void {
    this.applicationId.set(this.route.snapshot.queryParams['applicationId'] || '');
    this.employmentType.set(this.route.snapshot.queryParams['employmentType'] || 'SALARIED');
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || '');
    
    if (!this.applicationId()) {
      this.notificationService.error('Error', 'Application ID not found');
      this.router.navigate(['/applicant/dashboard']);
      return;
    }

    // Load document requirements based on employment type
    const requirements = getDocumentRequirements(this.employmentType());
    this.documentCategories.set(requirements);

    // Load already uploaded documents
    this.loadUploadedDocuments();
  }

  /**
   * Get all required document types
   */
  private getRequiredDocumentTypes(): string[] {
    const types: string[] = [];
    this.documentCategories().forEach(cat => {
      cat.documents.forEach(doc => {
        if (doc.required) {
          types.push(doc.documentType);
        }
      });
    });
    return types;
  }

  /**
   * Load already uploaded documents from backend
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
          id: doc.id,
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
   * Handle file selection for a specific document
   */
  onFileSelected(event: Event, document: DocumentRequirement): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files), document);
    }
    // Reset input to allow re-uploading same file
    input.value = '';
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  /**
   * Handle drop event for a specific document
   */
  onDrop(event: DragEvent, document: DocumentRequirement): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFiles(Array.from(event.dataTransfer.files), document);
    }
  }

  /**
   * Handle files for upload
   */
  private handleFiles(files: File[], document: DocumentRequirement): void {
    // Check current upload count for this document type
    const currentCount = this.uploadedDocuments().filter(doc => 
      doc.documentType === document.documentType
    ).length;

    if (currentCount + files.length > document.maxFiles) {
      this.notificationService.warning(
        'Too Many Files',
        `Maximum ${document.maxFiles} file(s) allowed for ${document.displayName}`
      );
      return;
    }

    // Validate and upload each file
    files.forEach(file => {
      if (this.validateFile(file, document)) {
        this.uploadFile(file, document);
      }
    });
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, document: DocumentRequirement): boolean {
    // Check file type
    if (!document.acceptedTypes.includes(file.type)) {
      this.notificationService.error(
        'Invalid File Type',
        `${file.name} is not a valid file type. Accepted: ${this.getAcceptedTypesDisplay(document.acceptedTypes)}`
      );
      return false;
    }

    // Check file size
    const maxSizeBytes = document.maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.notificationService.error(
        'File Too Large',
        `${file.name} exceeds maximum size of ${document.maxFileSize}MB`
      );
      return false;
    }

    return true;
  }

  /**
   * Upload file to backend
   */
  private uploadFile(file: File, document: DocumentRequirement): void {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', document.documentType);

    // Create temporary document for UI
    const tempDoc: UploadedDocument = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      documentType: document.documentType,
      uploadedAt: new Date(),
      uploading: true,
      progress: 0
    };

    // Add to uploaded documents
    this.uploadedDocuments.update(docs => [...docs, tempDoc]);

    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Upload to backend
    this.http.post(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/documents/upload`,
      formData,
      {
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          // Update progress
          const progress = Math.round((100 * event.loaded) / event.total);
          this.uploadedDocuments.update(docs => 
            docs.map(d => d.id === tempDoc.id ? { ...d, progress } : d)
          );
        } else if (event.type === HttpEventType.Response) {
          // Upload complete
          const response = event.body as any;
          this.uploadedDocuments.update(docs => 
            docs.map(d => d.id === tempDoc.id ? {
              ...d,
              id: response.documentId || response.id,
              uploading: false,
              progress: 100,
              url: response.fileUrl
            } : d)
          );
          this.notificationService.success('Success', `${file.name} uploaded successfully`);
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploadedDocuments.update(docs => 
          docs.map(d => d.id === tempDoc.id ? {
            ...d,
            uploading: false,
            error: error.error?.message || 'Upload failed'
          } : d)
        );
        this.notificationService.error('Upload Failed', error.error?.message || 'Failed to upload document');
      }
    });
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
        this.notificationService.success('Deleted', 'Document deleted successfully');
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this.notificationService.error('Delete Failed', error.error?.message || 'Failed to delete document');
      }
    });
  }

  /**
   * Get documents for a category
   */
  getCategoryDocuments(category: CategoryRequirement): UploadedDocument[] {
    const docTypes = category.documents.map(d => d.documentType);
    return this.uploadedDocuments().filter(doc => docTypes.includes(doc.documentType));
  }

  /**
   * Get documents for a specific document requirement
   */
  getDocumentFiles(document: DocumentRequirement): UploadedDocument[] {
    return this.uploadedDocuments().filter(doc => doc.documentType === document.documentType);
  }

  /**
   * Check if a document is currently being uploaded
   */
  isDocumentUploading(document: DocumentRequirement): boolean {
    return this.uploadedDocuments().some(doc => 
      doc.documentType === document.documentType && 
      doc.uploading === true
    );
  }

  /**
   * Check if a document requirement is complete (has uploaded files)
   */
  isDocumentComplete(document: DocumentRequirement): boolean {
    // Only return true if there are actually uploaded files for this document type
    // AND they are not currently uploading (upload must be complete)
    return this.uploadedDocuments().some(doc => 
      doc.documentType === document.documentType && 
      !doc.uploading && 
      !doc.error
    );
  }

  /**
   * Check if all required documents in a category are complete
   */
  isCategoryComplete(category: CategoryRequirement): boolean {
    const requiredDocs = category.documents.filter(doc => doc.required);
    if (requiredDocs.length === 0) return false;
    return requiredDocs.every(doc => this.isDocumentComplete(doc));
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
   * Submit documents and continue to summary or return URL
   */
  submitAndContinue(): void {
    if (!this.isComplete()) {
      this.notificationService.warning('Incomplete', 'Please upload all required documents before continuing');
      return;
    }

    this.notificationService.success('Success', 'Documents uploaded successfully');
    
    const returnUrl = this.returnUrl();
    if (returnUrl) {
      // If returnUrl is provided (coming from summary), navigate there
      this.router.navigateByUrl(returnUrl);
    } else {
      // Otherwise, navigate to application summary
      this.router.navigate(['/applicant/application-summary'], {
        queryParams: {
          applicationId: this.applicationId(),
          employmentType: this.employmentType()
        }
      });
    }
  }

  /**
   * Save and exit
   */
  saveAndExit(): void {
    this.notificationService.info('Saved', 'Your progress has been saved. You can continue later.');
    this.router.navigate(['/applicant/dashboard']);
  }

  /**
   * Navigate back to previous step or return URL
   */
  goBack(): void {
    const returnUrl = this.returnUrl();
    if (returnUrl) {
      // If returnUrl is provided (coming from summary), navigate there
      this.router.navigateByUrl(returnUrl);
    } else {
      // Otherwise, go to previous step (employment-details)
      this.router.navigate(['/applicant/employment-details'], {
        queryParams: {
          applicationId: this.applicationId(),
        }
      });
    }
  }
}
