import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LoanOfficerService, CompleteApplicationDetailsResponse } from '../../../../core/services/loan-officer.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-approval-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approval-summary.component.html',
  styleUrl: './approval-summary.component.css'
})
export class ApprovalSummaryComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loanOfficerService = inject(LoanOfficerService);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);
  applicationId = signal<string | null>(null);
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  approvalData = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId.set(id);
      
      // Get approval data from route state
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras?.state || (history.state as any);
      if (state?.approvalData) {
        this.approvalData.set(state.approvalData);
      }
      
      this.loadApplicationDetails(id);
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Load complete application details
   */
  loadApplicationDetails(applicationId: string): void {
    this.isLoading.set(true);
    this.loanOfficerService.getCompleteApplicationDetails(applicationId).subscribe({
      next: (data: CompleteApplicationDetailsResponse) => {
        this.applicationDetails.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading application details:', error);
        this.notificationService.error('Error', 'Failed to load application details');
        this.isLoading.set(false);
        this.router.navigate(['/loan-officer/applications/assigned']);
      }
    });
  }

  /**
   * Calculate EMI
   */
  calculateEMI(principal: number, rate: number, tenure: number): number {
    if (!principal || !rate || !tenure) return 0;
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return emi;
  }

  /**
   * Get approval details
   */
  getApprovalDetails() {
    const app = this.applicationDetails();
    const approval = this.approvalData();
    
    if (!app) return null;

    // Use approval data if available, otherwise fall back to application data
    const approvedAmount = approval?.approvedAmount || app.applicationInfo.loanAmount;
    const approvedTenure = approval?.approvedTenureMonths || app.applicationInfo.tenureMonths;
    const approvedRate = approval?.approvedInterestRate || 12.5;

    const emi = this.calculateEMI(approvedAmount, approvedRate, approvedTenure);
    const totalInterest = (emi * approvedTenure) - approvedAmount;
    const totalRepayment = emi * approvedTenure;

    return {
      approvedAmount,
      approvedTenure,
      approvedRate,
      monthlyEmi: emi,
      totalInterest,
      totalRepayment,
      decisionReason: approval?.decisionReason || ''
    };
  }

  /**
   * Download approval letter as PDF (opens print dialog in same tab)
   */
  downloadApprovalLetter(): void {
    const app = this.applicationDetails();
    if (!app) return;

    const approval = this.getApprovalDetails();
    if (!approval) return;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      this.notificationService.error('Error', 'Unable to generate PDF');
      return;
    }

    // Create HTML content for PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Loan Approval Letter</title>
        <style>
          @media print {
            @page { margin: 20mm; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #000; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
          .header h1 { color: #10b981; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0; font-size: 14px; }
          .approval-badge { background: #10b981; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .section { margin: 25px 0; page-break-inside: avoid; }
          .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; font-size: 18px; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
          .info-item { padding: 10px; background: #f9fafb; border-left: 3px solid #10b981; }
          .info-label { font-weight: bold; color: #6b7280; font-size: 11px; }
          .info-value { color: #1f2937; font-size: 14px; margin-top: 3px; }
          .emi-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; page-break-inside: avoid; }
          .emi-box h3 { margin: 0 0 15px 0; font-size: 18px; }
          .emi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .emi-item { text-align: center; }
          .emi-label { font-size: 11px; opacity: 0.9; }
          .emi-value { font-size: 22px; font-weight: bold; margin-top: 5px; }
          .terms { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; page-break-inside: avoid; }
          .terms h3 { margin-top: 0; font-size: 16px; }
          .terms ul { margin: 10px 0; padding-left: 20px; }
          .terms li { margin: 5px 0; font-size: 13px; }
          .footer { margin-top: 40px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px; }
          .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
          .signature-box { text-align: center; padding-top: 25px; border-top: 2px solid #000; }
          ol { padding-left: 20px; }
          ol li { margin: 8px 0; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏦 LoanScreen</h1>
          <p>Loan Management System</p>
          <p>Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="approval-badge">✅ LOAN APPROVED</div>

        <div class="section">
          <h2>Applicant Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Full Name</div>
              <div class="info-value">${app.applicantIdentity.personalDetails.fullName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Application ID</div>
              <div class="info-value">${app.applicationInfo.id}</div>
            </div>
            <div class="info-item">
              <div class="info-label">PAN Number</div>
              <div class="info-value">${app.applicantIdentity.personalDetails.panNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${app.applicantIdentity.contactInfo.email}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Loan Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Loan Type</div>
              <div class="info-value">${app.applicationInfo.loanType}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Approved Amount</div>
              <div class="info-value">₹${approval.approvedAmount.toLocaleString('en-IN')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tenure</div>
              <div class="info-value">${approval.approvedTenure} months</div>
            </div>
            <div class="info-item">
              <div class="info-label">Interest Rate</div>
              <div class="info-value">${approval.approvedRate}% per annum</div>
            </div>
          </div>
        </div>

        <div class="emi-box">
          <h3>💰 EMI Breakdown</h3>
          <div class="emi-grid">
            <div class="emi-item">
              <div class="emi-label">Monthly EMI</div>
              <div class="emi-value">₹${Math.round(approval.monthlyEmi).toLocaleString('en-IN')}</div>
            </div>
            <div class="emi-item">
              <div class="emi-label">Total Interest</div>
              <div class="emi-value">₹${Math.round(approval.totalInterest).toLocaleString('en-IN')}</div>
            </div>
            <div class="emi-item">
              <div class="emi-label">Total Repayment</div>
              <div class="emi-value">₹${Math.round(approval.totalRepayment).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div class="terms">
          <h3>⚠️ Terms & Conditions</h3>
          <ul>
            <li>This approval is subject to final verification of all submitted documents</li>
            <li>Loan disbursement will be processed within 3-5 business days</li>
            <li>First EMI payment is due on the 1st of next month after disbursement</li>
            <li>Pre-payment charges may apply as per bank policy</li>
            <li>Late payment will attract penalty charges</li>
          </ul>
        </div>

        <div class="section">
          <h2>Next Steps</h2>
          <ol>
            <li>Visit the nearest branch with original documents for verification</li>
            <li>Complete KYC formalities if not already done</li>
            <li>Sign the loan agreement</li>
            <li>Provide post-dated cheques for EMI payments</li>
            <li>Loan amount will be disbursed to your registered bank account</li>
          </ol>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <p><strong>Loan Officer</strong></p>
            <p>${app.applicationInfo.assignedOfficerName || 'Authorized Signatory'}</p>
          </div>
          <div class="signature-box">
            <p><strong>Branch Manager</strong></p>
            <p>Authorized Signatory</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>LoanScreen - Loan Management System</strong></p>
          <p>This is a computer-generated document and does not require a physical signature</p>
          <p>For queries, contact: support&#64;loanscreen.com | +91-1800-XXX-XXXX</p>
        </div>
      </body>
      </html>
    `;

    // Write content to iframe
    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();

    // Wait for content to load then trigger print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/loan-officer/dashboard']);
  }

  /**
   * View full application details
   */
  viewApplicationDetails(): void {
    const appId = this.applicationId();
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'details']);
    }
  }

  /**
   * Go to assigned applications
   */
  goToApplications(): void {
    this.router.navigate(['/loan-officer/applications/assigned']);
  }
}
