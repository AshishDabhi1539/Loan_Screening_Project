import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

interface DocumentInfo {
  id: number;
  name: string;
  documentType: string;
  size: number;
  uploadedAt: string;
  publicUrl?: string;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.css'
})
export class DocumentViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  applicationId = signal<string>('');
  documents = signal<DocumentInfo[]>([]);
  isLoading = signal(false);
  selectedDocument = signal<DocumentInfo | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('applicationId');
    if (!id) {
      this.notificationService.error('Invalid URL', 'Missing application ID');
      this.router.navigate(['/applicant/applications']);
      return;
    }
    this.applicationId.set(id);
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<DocumentInfo[]>(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/documents`,
      { headers }
    ).subscribe({
      next: (documents) => {
        this.documents.set(documents);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load documents', error);
        this.notificationService.error('Error', 'Failed to load documents');
        this.isLoading.set(false);
      }
    });
  }

  viewDocument(document: DocumentInfo): void {
    if (document.publicUrl) {
      // Open Supabase URL in new tab
      window.open(document.publicUrl, '_blank');
    } else {
      // Fallback: download the document
      this.downloadDocument(document);
    }
  }

  downloadDocument(document: DocumentInfo): void {
    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/documents/${document.id}/download`,
      { headers, responseType: 'blob' }
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Failed to download document', error);
        this.notificationService.error('Error', 'Failed to download document');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDocumentIcon(documentType: string): string {
    const iconMap: { [key: string]: string } = {
      'PAN_CARD': '🆔',
      'AADHAAR_CARD': '🆔',
      'PASSPORT': '📘',
      'VOTER_ID': '🗳️',
      'DRIVING_LICENSE': '🚗',
      'UTILITY_BILL': '🧾',
      'BANK_STATEMENT': '🏦',
      'SALARY_SLIP': '💰',
      'ITR_FORM': '📊',
      'PHOTOGRAPH': '📷',
      'BUSINESS_REGISTRATION': '📋',
      'GST_CERTIFICATE': '📜'
    };
    return iconMap[documentType] || '📄';
  }

  goBack(): void {
    this.router.navigate(['/applicant/application-details', this.applicationId()]);
  }
}
