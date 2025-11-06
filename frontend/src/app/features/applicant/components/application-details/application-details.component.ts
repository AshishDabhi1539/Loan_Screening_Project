import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { LoanApplicationResponse, DocumentUploadResponse } from '../../../../core/models/loan-application.model';
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

  /**
   * Check if application is approved
   */
  isApproved(): boolean {
    return this.app()?.status === 'APPROVED';
  }

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
   */
  private loadApplicationSummary(id: string): void {
    this.loanAppService.getMyApplications().subscribe({
      next: (apps) => {
        // Find the application - API response may have additional fields
        const summary = (apps as any[]).find((a: any) => a.id === id);
        if (summary) {
          // Extract progress information from API response
          this.applicationSummary.set({
            hasPersonalDetails: summary.hasPersonalDetails,
            hasFinancialProfile: summary.hasFinancialProfile,
            documentsCount: summary.documentsCount || 0,
            employmentType: summary.employmentType
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
  
  /**
   * Get simplified status display for applicants (only relevant statuses)
   */
  getSimpleStatusDisplay(status: string): string {
    const simpleStatusMap: { [key: string]: string } = {
      'SUBMITTED': 'Submitted',
      'UNDER_REVIEW': 'Under Review',
      'DOCUMENT_VERIFICATION': 'Under Review',
      'DOCUMENT_REVERIFICATION': 'Under Review',
      'PENDING_EXTERNAL_VERIFICATION': 'Under Review',
      'EXTERNAL_VERIFICATION': 'Under Review',
      'READY_FOR_DECISION': 'Under Review',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'WITHDRAWN': 'Withdrawn'
    };
    return simpleStatusMap[status] || 'Under Review';
  }

  getStatusBadgeColor(status: string): string {
    return this.dashboardService.getStatusBadgeColor(status);
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }
  
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }
  
  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getDocumentStatusBadge(status: string): string {
    const statusMap: { [key: string]: string } = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'UPLOADED': 'bg-blue-100 text-blue-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }
  
  getDocumentTypeDisplay(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Get document status display text
   */
  getDocumentStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'VERIFIED': 'Verified',
      'PENDING': 'Pending',
      'REJECTED': 'Rejected',
      'UPLOADED': 'Uploaded'
    };
    return statusMap[status] || 'Pending';
  }
  
  /**
   * Get document status badge CSS classes
   */
  getDocumentStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'UPLOADED': 'bg-blue-100 text-blue-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }
  
  /**
   * View document in new tab
   */
  viewDocument(doc: DocumentUploadResponse): void {
    const appId = this.app()?.id;
    if (!appId) {
      this.notification.error('Error', 'Application ID not available');
      return;
    }
    
    // Construct document view URL
    const viewUrl = `/api/loan-applications/${appId}/documents/${doc.id}/view`;
    window.open(viewUrl, '_blank');
  }
  
  /**
   * Download document
   */
  downloadDocument(documentId: number, fileName: string): void {
    const appId = this.app()?.id;
    if (!appId) {
      this.notification.error('Error', 'Application ID not available');
      return;
    }
    
    // Construct document download URL
    const downloadUrl = `/api/loan-applications/${appId}/documents/${documentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Calculate EMI for approved loan
   */
  calculateApprovedEMI(): any {
    const application = this.app();
    if (!application) return null;
    
    const principal = application.requestedAmount;
    const rate = this.getInterestRateValue(application.loanType) / 100 / 12;
    const tenure = application.tenureMonths;
    
    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    const totalInterest = (emi * tenure) - principal;
    const totalRepayment = emi * tenure;
    
    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment),
      interestRate: this.getInterestRateValue(application.loanType)
    };
  }
  
  /**
   * Download approval letter
   */
  downloadApprovalLetter(): void {
    const application = this.app();
    if (!application) return;
    
    const emiDetails = this.calculateApprovedEMI();
    if (!emiDetails) return;
    
    const docs = this.documents();
    console.log('📄 Generating PDF with documents:', docs.length, docs);
    this.generateApprovalLetterPDF(application, emiDetails, docs);
  }
  
  /**
   * Generate approval letter PDF
   */
  private generateApprovalLetterPDF(application: LoanApplicationResponse, emiDetails: any, documents: DocumentUploadResponse[]): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      this.notification.error('Error', 'Unable to generate PDF');
      return;
    }
    
    // Generate simple documents list
    let documentsListHTML = '<p style="color: #6b7280; font-size: 13px;">No documents uploaded</p>';
    if (documents && documents.length > 0) {
      documentsListHTML = documents.map((doc, index) => {
        const docType = doc.documentType ? this.getDocumentTypeDisplay(doc.documentType) : 'Document';
        return `<div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #1f2937;">${index + 1}.</span>
          <span style="color: #374151; margin-left: 8px;">${docType}</span>
        </div>`;
      }).join('');
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Loan Approval Letter</title>
        <style>
          @media print {
            @page { margin: 15mm; }
          }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; background: white; }
          .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #10b981; }
          .header h1 { color: #10b981; margin: 0; font-size: 28px; font-weight: 700; }
          .header p { color: #6b7280; margin: 5px 0; font-size: 12px; }
          .approval-badge { background: #10b981; color: white; padding: 10px 20px; display: inline-block; border-radius: 6px; font-weight: 600; margin: 15px 0; font-size: 15px; }
          .section { margin: 20px 0; page-break-inside: avoid; }
          .section h2 { color: #1f2937; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; font-size: 16px; margin-bottom: 12px; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
          .info-item { padding: 10px; background: #f9fafb; border-left: 2px solid #10b981; }
          .info-label { font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase; }
          .info-value { color: #1f2937; font-size: 13px; margin-top: 3px; }
          .timeline { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0; }
          .timeline-item { text-align: center; padding: 10px; background: #f9fafb; }
          .timeline-item.approved { background: #d1fae5; }
          .timeline-label { font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
          .timeline-value { font-size: 12px; color: #1f2937; font-weight: 600; margin-top: 3px; }
          .timeline-item.approved .timeline-value { color: #059669; }
          .emi-box { background: #10b981; color: white; padding: 15px; margin: 15px 0; }
          .emi-box h3 { margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }
          .emi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .emi-item { text-align: center; padding: 10px; background: rgba(255,255,255,0.2); }
          .emi-label { font-size: 10px; opacity: 0.9; }
          .emi-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
          .emi-note { font-size: 10px; margin-top: 10px; text-align: center; opacity: 0.9; }
          .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
          .info-box { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px; page-break-inside: avoid; }
          .info-box.blue { background: #dbeafe; border-left-color: #3b82f6; }
          .info-box h3 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937; }
          .info-box ul, .info-box ol { margin: 6px 0; padding-left: 18px; }
          .info-box li { margin: 4px 0; font-size: 11px; line-height: 1.4; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; }
          .footer strong { color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏦 Loanify</h1>
          <p>Your Trusted Loan Solution Partner</p>
          <p>Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div style="text-align: center;">
          <div class="approval-badge">✅ LOAN APPROVED</div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 10px;">Application ID: ${application.id}</p>
        </div>

        <div class="section">
          <h2>👤 Applicant Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Full Name</div>
              <div class="info-value">${application.applicantName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email Address</div>
              <div class="info-value">${application.applicantEmail}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone Number</div>
              <div class="info-value">${application.applicantPhone}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Application ID</div>
              <div class="info-value">${application.id.substring(0, 16)}...</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>💰 Loan Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Loan Type</div>
              <div class="info-value">${this.getLoanTypeDisplay(application.loanType)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Approved Amount</div>
              <div class="info-value" style="color: #10b981; font-size: 16px;">₹${application.requestedAmount.toLocaleString('en-IN')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tenure</div>
              <div class="info-value">${application.tenureMonths} months</div>
            </div>
            <div class="info-item">
              <div class="info-label">Interest Rate</div>
              <div class="info-value">${emiDetails.interestRate}% per annum</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>⏰ Application Timeline</h2>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-label">Submitted</div>
              <div class="timeline-value">${this.formatDate(application.submittedAt)}</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-label">Last Updated</div>
              <div class="timeline-value">${this.formatDate(application.updatedAt)}</div>
            </div>
            <div class="timeline-item approved">
              <div class="timeline-label">Status</div>
              <div class="timeline-value">Approved</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📄 Uploaded Documents</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            ${documentsListHTML}
          </div>
        </div>

        <div class="emi-box">
          <h3>💰 EMI Breakdown</h3>
          <div class="emi-grid">
            <div class="emi-item">
              <div class="emi-label">Monthly EMI</div>
              <div class="emi-value">₹${emiDetails.monthlyEmi.toLocaleString('en-IN')}</div>
            </div>
            <div class="emi-item">
              <div class="emi-label">Total Interest</div>
              <div class="emi-value">₹${emiDetails.totalInterest.toLocaleString('en-IN')}</div>
            </div>
            <div class="emi-item">
              <div class="emi-label">Total Repayment</div>
              <div class="emi-value">₹${emiDetails.totalRepayment.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div class="emi-note">Fixed EMI for ${application.tenureMonths} months | First EMI due on 1st of next month after disbursement</div>
        </div>

        <div class="info-boxes">
          <div class="info-box">
            <h3>⚠️ Important Terms</h3>
            <ul>
              <li>Loan disbursement within 3-5 business days</li>
              <li>Subject to final document verification</li>
              <li>Pre-payment charges as per bank policy</li>
              <li>Late payment penalty applicable</li>
              <li>Interest rate fixed for entire tenure</li>
            </ul>
          </div>
          
          <div class="info-box blue">
            <h3>📋 Next Steps</h3>
            <ol>
              <li>Visit nearest branch with original documents</li>
              <li>Complete KYC formalities</li>
              <li>Sign loan agreement</li>
            <li>Provide post-dated cheques for EMI payments</li>
            <li>Loan amount will be disbursed to your registered bank account</li>
          </ol>
        </div>

        <div class="footer">
          <p><strong>Loanify - Your Loan Solution</strong></p>
          <p>This is a computer-generated document and does not require a physical signature</p>
          <p>For queries, contact: support@loanscreen.com | +91-1800-XXX-XXXX</p>
        </div>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };
  }
  
  /**
   * Navigate back to applications
   */
  goToApplications(): void {
    this.router.navigate(['/applicant/applications']);
  }
  
  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  onDownloadPdf(): void {
    const application = this.app();
    if (!application) return;
    
    this.generateApplicationPDF(application);
  }

  private generateApplicationPDF(application: LoanApplicationResponse): void {
    // Create PDF content using browser's print functionality with custom styling
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loan Application - ${application.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin-bottom: 10px; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #111827; }
          .status { padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-under-review { background-color: #fef3c7; color: #92400e; }
          .status-approved { background-color: #d1fae5; color: #065f46; }
          .status-rejected { background-color: #fee2e2; color: #991b1b; }
          .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏦 Loanify</div>
          <h1>Loan Application Details</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <div class="section-title">Application Overview</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Loan Type:</div>
              <div class="value">${this.getLoanTypeDisplay(application.loanType)}</div>
            </div>
            <div class="info-item">
              <div class="label">Status:</div>
              <div class="value">
                <span class="status status-${application.status.toLowerCase().replace('_', '-')}">${this.getStatusDisplay(application.status)}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Requested Amount:</div>
              <div class="value amount">${this.formatCurrency(application.requestedAmount)}</div>
            </div>
            <div class="info-item">
              <div class="label">Tenure:</div>
              <div class="value">${application.tenureMonths} months</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Applicant Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Full Name:</div>
              <div class="value">${application.applicantName}</div>
            </div>
            <div class="info-item">
              <div class="label">Email:</div>
              <div class="value">${application.applicantEmail}</div>
            </div>
            <div class="info-item">
              <div class="label">Phone:</div>
              <div class="value">${application.applicantPhone}</div>
            </div>
            <div class="info-item">
              <div class="label">Application Date:</div>
              <div class="value">${new Date(application.submittedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Loan Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Purpose:</div>
              <div class="value">${application.purpose}</div>
            </div>
            <div class="info-item">
              <div class="label">Interest Rate:</div>
              <div class="value">${this.getInterestRate(application.loanType)}% per annum</div>
            </div>
            <div class="info-item">
              <div class="label">Monthly EMI:</div>
              <div class="value">${this.calculateEMI(application.requestedAmount, application.tenureMonths)}</div>
            </div>
            <div class="info-item">
              <div class="label">Risk Level:</div>
              <div class="value">${application.riskLevel || 'Under Assessment'}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Loanify</strong> - Your Loan Solution</p>
          <p>This is a computer-generated document. No signature required.</p>
          <p>Application ID: ${application.id}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

    // Step 3: All application steps complete but still DRAFT -> show summary for final submission
    this.notification.info('Application Ready', 'Your application is ready for submission');
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
}


