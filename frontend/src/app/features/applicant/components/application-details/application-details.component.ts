import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LoanApplicationService, LoanApplicationResponse } from '../../../../core/services/loan-application.service';
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
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load application', err);
        this.notification.error('Error', 'Could not load application');
        this.isLoading.set(false);
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

  viewDocuments(): void {
    const application = this.app();
    if (!application) return;
    this.router.navigate(['/applicant/document-viewer', application.id]);
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


