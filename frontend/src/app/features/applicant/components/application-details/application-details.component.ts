import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { LoanApplicationResponse } from '../../../../core/models/loan-application.model';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.css'
})
export class ApplicationDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loanAppService = inject(LoanApplicationService);
  private readonly dashboardService = inject(DashboardService);
  private readonly notification = inject(NotificationService);
  private readonly apiService = inject(ApiService);

  isLoading = signal(false);
  app = signal<LoanApplicationResponse | null>(null);
  applicationSummary = signal<any | null>(null);
  documents = signal<any[]>([]);
  isLoadingDocuments = signal(false);
  confettiShown = signal(false);

  // Computed properties for approved applications
  isApproved = computed(() => {
    const app = this.app();
    return app?.status === 'APPROVED' || app?.status === 'MANUAL_APPROVED' || app?.status === 'AUTO_APPROVED';
  });

  constructor() {
    // Trigger confetti when approved application is loaded
    effect(() => {
      const approved = this.isApproved();
      const loading = this.isLoading();
      const shown = this.confettiShown();
      
      if (approved && !loading && !shown) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          this.triggerConfetti();
        }, 300);
      }
    });
  }

  approvedLoanDetails = computed(() => {
    const summary = this.applicationSummary();
    const app = this.app();
    if (!summary || !app) return null;

    const approvedAmount = summary.approvedAmount || app.requestedAmount;
    const approvedTenure = summary.approvedTenureMonths || app.tenureMonths;
    const approvedRate = summary.approvedInterestRate || this.getInterestRate(app.loanType);

    const monthlyRate = approvedRate / 12 / 100;
    const monthlyEmi = (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, approvedTenure)) / 
                      (Math.pow(1 + monthlyRate, approvedTenure) - 1);
    const totalPayable = monthlyEmi * approvedTenure;
    const totalInterest = totalPayable - approvedAmount;

    return {
      approvedAmount,
      approvedTenure,
      approvedRate,
      monthlyEmi: Math.round(monthlyEmi),
      totalPayable: Math.round(totalPayable),
      totalInterest: Math.round(totalInterest)
    };
  });

  ngOnInit(): void {
    const qpId = this.route.snapshot.queryParamMap.get('applicationId');
    const paramId = this.route.snapshot.paramMap.get('id');
    const id = qpId || paramId;
    if (!id) {
      this.notification.error('Invalid URL', 'Missing application id');
      this.router.navigate(['/applicant/dashboard']);
      return;
    }
    this.fetch(id);
  }

  fetch(id: string): void {
    this.isLoading.set(true);
    this.loanAppService.getApplicationById(id).subscribe({
      next: (data) => {
        this.app.set(data);
        // Also fetch application summary to get progress info (hasPersonalDetails, hasFinancialProfile, documentsCount)
        this.loadApplicationSummary(id);
        // Load documents for submitted applications
        if (data.status !== 'DRAFT') {
          this.loadDocuments(id);
        }
        this.isLoading.set(false);
        
        // Trigger confetti if approved
        if (this.isApproved() && !this.confettiShown()) {
          setTimeout(() => {
            this.triggerConfetti();
          }, 500);
        }
      },
      error: (err) => {
        console.error('Failed to load application', err);
        this.notification.error('Error', 'Could not load application');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load documents for the application
   */
  private loadDocuments(applicationId: string): void {
    this.isLoadingDocuments.set(true);
    this.loanAppService.getDocuments(applicationId).subscribe({
      next: (docs) => {
        // Log document structure to see what properties are available
        if (docs && docs.length > 0) {
          console.log('Document structure:', docs[0]);
        }
        this.documents.set(docs || []);
        this.isLoadingDocuments.set(false);
      },
      error: (err) => {
        console.error('Failed to load documents', err);
        this.documents.set([]);
        this.isLoadingDocuments.set(false);
      }
    });
  }

  /**
   * Load application summary to get progress information
   * The API response includes hasPersonalDetails, hasFinancialProfile, documentsCount, employmentType
   * even though they're not in the LoanApplicationResponse interface
   * Also includes approvedAmount, approvedInterestRate, approvedTenureMonths for approved applications
   */
  private loadApplicationSummary(id: string): void {
    this.loanAppService.getMyApplications().subscribe({
      next: (apps) => {
        // Find the application - API response may have additional fields
        const summary = (apps as any[]).find((a: any) => a.id === id);
        if (summary) {
          // Extract progress information and approved loan details from API response
          this.applicationSummary.set({
            hasPersonalDetails: summary.hasPersonalDetails,
            hasFinancialProfile: summary.hasFinancialProfile,
            documentsCount: summary.documentsCount || 0,
            employmentType: summary.employmentType,
            approvedAmount: summary.approvedAmount,
            approvedInterestRate: summary.approvedInterestRate,
            approvedTenureMonths: summary.approvedTenureMonths
          });
        }
      },
      error: (err) => {
        console.error('Failed to load application summary', err);
        // Don't show error to user, just continue without summary data
        // Resume button will still work but may not route as intelligently
      }
    });
  }

  getStatusDisplay(status: string): string {
    return this.dashboardService.getStatusDisplay(status);
  }

  getStatusBadgeColor(status: string): string {
    return this.dashboardService.getStatusBadgeColor(status);
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  onDownloadPdf(): void {
    const application = this.app();
    if (!application) return;
    
    // Load documents if not already loaded
    if (this.documents().length === 0 && !this.isLoadingDocuments()) {
      this.loadDocuments(application.id);
      // Wait for documents to load, then generate PDF
      setTimeout(() => {
        this.generateApplicationPDF(application);
      }, 1000);
    } else {
      this.generateApplicationPDF(application);
    }
  }

  private generateApplicationPDF(application: LoanApplicationResponse): void {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const documents = this.documents();
    const documentsList = documents.length > 0 
      ? documents.map((doc, index) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${this.getDocumentTypeDisplay(doc.documentType)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${doc.fileName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${this.formatDate(doc.uploadedAt)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; 
                ${doc.status === 'VERIFIED' ? 'background-color: #d1fae5; color: #065f46;' : ''}
                ${doc.status === 'PENDING' ? 'background-color: #fef3c7; color: #92400e;' : ''}
                ${doc.status === 'REJECTED' ? 'background-color: #fee2e2; color: #991b1b;' : ''}
              ">${doc.status}</span>
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #6b7280;">No documents submitted</td></tr>';

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loan Application Details</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            color: #1f2937; 
            line-height: 1.6;
            padding: 30px;
            background: white;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 25px; 
            margin-bottom: 35px; 
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 10px;
          }
          .header h1 { 
            font-size: 22px; 
            color: #111827; 
            margin-bottom: 8px;
          }
          .header p { 
            font-size: 13px; 
            color: #6b7280; 
          }
          .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #111827; 
            margin-bottom: 15px; 
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-top: 15px;
          }
          .info-item { 
            margin-bottom: 12px; 
          }
          .label { 
            font-weight: 600; 
            color: #4b5563; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .value { 
            color: #111827; 
            font-size: 14px;
          }
          .status { 
            display: inline-block;
            padding: 6px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: 600; 
          }
          .status-under-review { background-color: #fef3c7; color: #92400e; }
          .status-approved { background-color: #d1fae5; color: #065f46; }
          .status-rejected { background-color: #fee2e2; color: #991b1b; }
          .status-draft { background-color: #e5e7eb; color: #374151; }
          .amount { 
            font-size: 22px; 
            font-weight: bold; 
            color: #2563eb; 
          }
          .documents-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .documents-table th {
            background-color: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
          }
          .documents-table td {
            padding: 10px 12px;
            font-size: 13px;
            color: #1f2937;
          }
          .documents-table tr:hover {
            background-color: #f9fafb;
          }
          .footer { 
            margin-top: 50px; 
            padding-top: 20px;
            text-align: center; 
            font-size: 11px; 
            color: #6b7280; 
            border-top: 2px solid #e5e7eb; 
          }
          .footer p {
            margin-bottom: 6px;
          }
          @media print { 
            body { margin: 0; padding: 20px; }
            .section { page-break-inside: avoid; }
            .documents-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏦 Loanify</div>
          <h1>Loan Application Details</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="section">
          <div class="section-title">Application Overview</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Loan Type</div>
              <div class="value">${this.getLoanTypeDisplay(application.loanType)}</div>
            </div>
            <div class="info-item">
              <div class="label">Status</div>
              <div class="value">
                <span class="status status-${application.status.toLowerCase().replace('_', '-')}">${this.getStatusDisplay(application.status)}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Requested Amount</div>
              <div class="value amount">${this.formatCurrency(application.requestedAmount)}</div>
            </div>
            <div class="info-item">
              <div class="label">Tenure</div>
              <div class="value">${application.tenureMonths} months</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Applicant Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Full Name</div>
              <div class="value">${application.applicantName}</div>
            </div>
            <div class="info-item">
              <div class="label">Email Address</div>
              <div class="value">${application.applicantEmail}</div>
            </div>
            <div class="info-item">
              <div class="label">Phone Number</div>
              <div class="value">${application.applicantPhone}</div>
            </div>
            <div class="info-item">
              <div class="label">Application Date</div>
              <div class="value">${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(application.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Loan Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Purpose</div>
              <div class="value">${application.purpose}</div>
            </div>
            <div class="info-item">
              <div class="label">Interest Rate</div>
              <div class="value">${this.getInterestRate(application.loanType)}% per annum</div>
            </div>
            <div class="info-item">
              <div class="label">Monthly EMI</div>
              <div class="value">${this.calculateEMI(application.requestedAmount, application.tenureMonths)}</div>
            </div>
            <div class="info-item">
              <div class="label">Risk Level</div>
              <div class="value">${application.riskLevel || 'Under Assessment'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Submitted Documents</div>
          <table class="documents-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Document Type</th>
                <th>File Name</th>
                <th>Uploaded Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${documentsList}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p><strong>Loanify</strong> - Your Trusted Loan Solution</p>
          <p>This is a computer-generated document. No signature required.</p>
        </div>
      </body>
      </html>
    `;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(pdfContent);
      iframeDoc.close();
      
      // Wait for content to load then trigger print dialog directly
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Remove iframe after a delay
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }
      }, 500);
    }
  }

  onDownloadReceipt(): void {
    const application = this.app();
    if (!application) return;
    this.apiService.downloadFile(`/loan-application/${application.id}/receipt`).subscribe({
      next: (blob: Blob) => this.saveBlob(blob, `receipt-${application.id}.pdf`),
      error: () => this.notification.error('Download failed', 'Unable to download receipt')
    });
  }

  onPrint(): void {
    window.print();
  }

  /**
   * View a specific document
   */
  viewDocument(documentId: number, fileName: string): void {
    const doc = this.documents().find(d => d.id === documentId);
    if (!doc) {
      this.notification.error('Error', 'Document not found');
      return;
    }

    // Check if document has a direct URL property (fileUrl, filePath, publicUrl, etc.)
    const docAny = doc as any;
    if (docAny.fileUrl) {
      window.open(docAny.fileUrl, '_blank');
      return;
    }
    if (docAny.filePath) {
      window.open(docAny.filePath, '_blank');
      return;
    }
    if (docAny.publicUrl) {
      window.open(docAny.publicUrl, '_blank');
      return;
    }
    if (docAny.url) {
      window.open(docAny.url, '_blank');
      return;
    }

    // If no direct URL, try to get it from the API
    const application = this.app();
    if (!application) {
      this.notification.error('Error', 'Application not found');
      return;
    }

    // Try the URL endpoint first
    this.apiService.get<string>(`/documents/${documentId}/url`).subscribe({
      next: (fileUrl: string) => {
        window.open(fileUrl, '_blank');
      },
      error: (urlError) => {
        // Fallback to download endpoint
        this.apiService.downloadFile(`/loan-application/${application.id}/documents/${documentId}/download`).subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
          },
          error: (error) => {
            console.error('View document error:', error, 'Document object:', doc);
            this.notification.error('View failed', 'Unable to view document. Please try downloading instead.');
          }
        });
      }
    });
  }

  /**
   * Download a specific document
   */
  downloadDocument(documentId: number, fileName: string): void {
    const doc = this.documents().find(d => d.id === documentId);
    if (!doc) {
      this.notification.error('Error', 'Document not found');
      return;
    }

    // Check if document has a direct URL property (fileUrl, filePath, publicUrl, etc.)
    const docAny = doc as any;
    if (docAny.fileUrl) {
      this.downloadFromUrl(docAny.fileUrl, fileName);
      return;
    }
    if (docAny.filePath) {
      this.downloadFromUrl(docAny.filePath, fileName);
      return;
    }
    if (docAny.publicUrl) {
      this.downloadFromUrl(docAny.publicUrl, fileName);
      return;
    }
    if (docAny.url) {
      this.downloadFromUrl(docAny.url, fileName);
      return;
    }

    // If no direct URL, try to get it from the API
    const application = this.app();
    if (!application) {
      this.notification.error('Error', 'Application not found');
      return;
    }

    // Try the URL endpoint first
    this.apiService.get<string>(`/documents/${documentId}/url`).subscribe({
      next: (fileUrl: string) => {
        this.downloadFromUrl(fileUrl, fileName);
      },
      error: (urlError) => {
        // Fallback to download endpoint
        this.apiService.downloadFile(`/loan-application/${application.id}/documents/${documentId}/download`).subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
          },
          error: (error) => {
            console.error('Download document error:', error, 'Document object:', doc);
            this.notification.error('Download failed', 'Unable to download document');
          }
        });
      }
    });
  }

  /**
   * Helper method to download from a URL
   */
  private downloadFromUrl(url: string, fileName: string): void {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        console.error('Download from URL failed:', error);
        // If fetch fails, try opening as direct link
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.click();
      });
  }

  /**
   * Get document type display name
   */
  getDocumentTypeDisplay(documentType: string): string {
    return documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  editApplication(): void {
    const application = this.app();
    if (!application) return;
    this.router.navigate(['/applicant/loan-application'], { 
      queryParams: { 
        applicationId: application.id,
        mode: 'edit'
      } 
    });
  }

  /**
   * Resume incomplete application - navigate to the step where user left off
   * Application flow: Apply for Loan -> Employment Details -> Document Upload -> Submit
   */
  resumeApplication(): void {
    const application = this.app();
    const summary = this.applicationSummary();
    
    if (!application) return;

    // Only resume if status is DRAFT
    if (application.status !== 'DRAFT') {
      return;
    }

    // Check if employment details are filled (hasFinancialProfile = true means employment details are complete)
    const employmentDetailsFilled = summary?.hasFinancialProfile === true;

    if (!employmentDetailsFilled) {
      // Step 1: Employment & Financial Details not filled -> go to employment-details
      this.notification.info('Continue Application', 'Please complete employment and financial details');
      this.router.navigate(['/applicant/employment-details'], {
        queryParams: { applicationId: application.id }
      });
      return;
    }

    // Step 2: Employment details are filled -> go directly to document upload
    // Check if documents are uploaded
    const documentsUploaded = summary?.documentsCount && summary.documentsCount > 0;

    if (!documentsUploaded) {
      this.notification.info('Upload Documents', 'Please upload required documents');
      this.router.navigate(['/applicant/document-upload'], {
        queryParams: {
          applicationId: application.id,
          employmentType: summary?.employmentType || 'SALARIED'
        }
      });
      return;
    }

    // Step 3: All application steps complete but still DRAFT -> navigate to summary for final submission
    this.notification.info('Application Ready', 'Your application is ready for submission');
    this.router.navigate(['/applicant/application-summary'], {
      queryParams: {
        applicationId: application.id,
        employmentType: summary?.employmentType || 'SALARIED'
      }
    });
  }

  /**
   * Check if application is incomplete (DRAFT status)
   */
  isIncomplete(): boolean {
    const application = this.app();
    return application?.status === 'DRAFT';
  }

  getLoanTypeDisplay(loanType: string): string {
    const typeMap: { [key: string]: string } = {
      'PERSONAL_LOAN': 'Personal Loan',
      'HOME_LOAN': 'Home Loan',
      'CAR_LOAN': 'Car Loan',
      'EDUCATION_LOAN': 'Education Loan',
      'BUSINESS_LOAN': 'Business Loan',
      'GOLD_LOAN': 'Gold Loan'
    };
    return typeMap[loanType] || loanType;
  }

  calculateEMI(amount: number, tenure: number): string {
    // Simple EMI calculation with assumed interest rate
    const rate = this.getInterestRateValue(this.app()?.loanType || '') / 100 / 12;
    const emi = (amount * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    return this.formatCurrency(emi);
  }

  getInterestRate(loanType: string): number {
    return this.getInterestRateValue(loanType);
  }

  private getInterestRateValue(loanType: string): number {
    const rateMap: { [key: string]: number } = {
      'PERSONAL_LOAN': 12.5,
      'HOME_LOAN': 8.5,
      'CAR_LOAN': 9.5,
      'EDUCATION_LOAN': 10.5,
      'BUSINESS_LOAN': 14.0,
      'GOLD_LOAN': 11.0
    };
    return rateMap[loanType] || 12.0;
  }

  getRiskLevelColor(riskLevel?: string): string {
    const colorMap: { [key: string]: string } = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-red-100 text-red-800'
    };
    return colorMap[riskLevel || ''] || 'bg-gray-100 text-gray-800';
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Trigger confetti animation for approved applications
   */
  private async triggerConfetti(): Promise<void> {
    if (this.confettiShown()) return;
    
    try {
      this.confettiShown.set(true);
      
      // Dynamically import canvas-confetti
      const confettiModule = await import('canvas-confetti');
      const confetti = confettiModule.default || confettiModule;
      
      const duration = 2000; // 2 seconds
      const end = Date.now() + duration;

      // Multi-color confetti (green, blue, yellow, orange, purple, pink, cyan, teal)
      const colors = [
        '#10b981', // Green
        '#3b82f6', // Blue
        '#f59e0b', // Amber/Yellow
        '#f97316', // Orange
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#14b8a6', // Teal
        '#22c55e', // Bright Green
        '#0ea5e9'  // Sky Blue
      ];

      // Get the main content container position to restrict confetti
      const mainContent = document.querySelector('.max-w-5xl');
      let contentTop = 0.2; // Default to 20% from top if container not found
      
      if (mainContent) {
        const rect = mainContent.getBoundingClientRect();
        contentTop = rect.top / window.innerHeight;
      }

      const frame = () => {
        try {
          // Confetti from top center of content area (below navbar)
          confetti({
            particleCount: 10,
            angle: 90,
            spread: 70,
            startVelocity: 30,
            origin: { x: 0.5, y: contentTop }, // Start at content area top
            colors: colors,
            gravity: 0.8,
            ticks: 200
          });
          
          // Confetti from left side of content
          confetti({
            particleCount: 6,
            angle: 60,
            spread: 60,
            startVelocity: 25,
            origin: { x: 0.1, y: contentTop + 0.05 },
            colors: colors,
            gravity: 0.8,
            ticks: 200
          });
          
          // Confetti from right side of content
          confetti({
            particleCount: 6,
            angle: 120,
            spread: 60,
            startVelocity: 25,
            origin: { x: 0.9, y: contentTop + 0.05 },
            colors: colors,
            gravity: 0.8,
            ticks: 200
          });
          
          // Additional burst from center
          confetti({
            particleCount: 8,
            angle: 90,
            spread: 80,
            startVelocity: 35,
            origin: { x: 0.5, y: contentTop + 0.1 },
            colors: colors,
            gravity: 0.8,
            ticks: 200
          });
        } catch (error) {
          console.error('Confetti error:', error);
        }

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    } catch (error) {
      console.error('Failed to trigger confetti:', error);
      this.confettiShown.set(false); // Reset so it can try again
    }
  }
}


