import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { NotificationService } from '../../../../core/services/notification.service';
import { AdminService } from '../../../../core/services/admin.service';
import { CompleteApplicationDetailsResponse } from '../../../../core/models/officer.model';

@Component({
  selector: 'app-admin-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.css'
})
export class ApplicationDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);

  isLoading = signal(false);
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  auditTrail = signal<any[]>([]);
  isLoadingAudit = signal(false);

  // Active tab for tabbed interface
  activeTab = signal<'overview' | 'personal' | 'financial' | 'documents' | 'audit'>('overview');
  applicationId = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId.set(id);
      this.loadApplicationDetails(id);
    } else {
      this.notificationService.error('Error', 'Invalid application ID');
      this.router.navigate(['/admin/applications']);
    }
  }

  /**
   * Load complete application details
   */
  private loadApplicationDetails(applicationId: string): void {
    this.isLoading.set(true);

    this.adminService.getApplicationDetails(applicationId).subscribe({
      next: (details) => {
        console.log('✅ Application details loaded:', details);
        this.applicationDetails.set(details);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading application details:', error);
        this.notificationService.error(
          'Error Loading Application',
          'Failed to load application details. Please try again.'
        );
        this.isLoading.set(false);
        this.router.navigate(['/admin/applications']);
      }
    });
  }

  /**
   * Go back to applications list
   */
  goBack(): void {
    this.router.navigate(['/admin/applications']);
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: 'overview' | 'personal' | 'financial' | 'documents' | 'audit'): void {
    this.activeTab.set(tab);
    
    // Load audit trail when audit tab is clicked
    if (tab === 'audit' && this.auditTrail().length === 0) {
      this.loadAuditTrail();
    }
  }

  /**
   * Load audit trail - shows all important events without conditions
   */
  private loadAuditTrail(): void {
    const appId = this.applicationId();
    if (!appId) return;

    this.isLoadingAudit.set(true);
    this.adminService.getAuditTrail(appId).subscribe({
      next: (trail) => {
        // Sort by timestamp descending (newest first) - no filtering, show all events
        const sortedTrail = trail.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        this.auditTrail.set(sortedTrail);
        this.isLoadingAudit.set(false);
      },
      error: (error) => {
        console.error('Error loading audit trail:', error);
        this.notificationService.error('Error', 'Failed to load audit trail');
        this.isLoadingAudit.set(false);
      }
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  /**
   * Format date only (without time) - for birth dates, etc.
   */
  formatDateOnly(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DOCUMENT_VERIFICATION':
      case 'DOCUMENT_REVERIFICATION':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLIANCE_REVIEW':
      case 'FLAGGED_FOR_COMPLIANCE':
      case 'UNDER_INVESTIGATION':
      case 'AWAITING_COMPLIANCE_DECISION':
        return 'bg-purple-100 text-purple-800';
      case 'READY_FOR_DECISION':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DISBURSED':
        return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get risk level badge class
   */
  getRiskLevelBadgeClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get document status badge class
   */
  getDocumentStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'MISSING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format employment type
   */
  formatEmploymentType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Calculate monthly EMI
   */
  calculateEMI(principal: number, rate: number, tenure: number): number {
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  }



  /**
   * Download PDF - same functionality as applicant side
   */
  onDownloadPdf(): void {
    const application = this.applicationDetails();
    if (!application) return;
    
    this.generateApplicationPDF(application);
  }

  private generateApplicationPDF(application: any): void {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const documents = application.documents || [];
    const documentsList = documents.length > 0 
      ? documents.map((doc: any, index: number) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${this.getDocumentTypeDisplay(doc.documentType)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${doc.fileName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${this.formatDate(doc.uploadDate || doc.uploadedAt)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; 
                ${doc.verificationStatus === 'VERIFIED' ? 'background-color: #d1fae5; color: #065f46;' : ''}
                ${doc.verificationStatus === 'PENDING' ? 'background-color: #fef3c7; color: #92400e;' : ''}
                ${doc.verificationStatus === 'REJECTED' ? 'background-color: #fee2e2; color: #991b1b;' : ''}
              ">${doc.verificationStatus}</span>
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #6b7280;">No documents submitted</td></tr>';

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loan Application Details - Admin View</title>
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
          .admin-badge {
            background-color: #1e40af;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            display: inline-block;
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
          .info-grid-3 { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
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
          .status-approved { background-color: #d1fae5; color: #065f46; }
          .status-rejected { background-color: #fee2e2; color: #991b1b; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-under-review { background-color: #dbeafe; color: #1e40af; }
          .amount { 
            font-size: 22px; 
            font-weight: bold; 
            color: #2563eb; 
          }
          .risk-high { color: #dc2626; font-weight: 600; }
          .risk-medium { color: #f59e0b; font-weight: 600; }
          .risk-low { color: #059669; font-weight: 600; }
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
            border-bottom: 1px solid #e5e7eb;
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
          <span class="admin-badge">ADMIN VIEW</span>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="section">
          <div class="section-title">Application Overview</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Application ID</div>
              <div class="value">${application.applicationInfo.id}</div>
            </div>
            <div class="info-item">
              <div class="label">Status</div>
              <div class="value">
                <span class="status status-${application.applicationInfo.status.toLowerCase()}">${application.applicationInfo.status}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Loan Type</div>
              <div class="value">${this.getLoanTypeDisplay(application.applicationInfo.loanType)}</div>
            </div>
            <div class="info-item">
              <div class="label">Requested Amount</div>
              <div class="value amount">${this.formatCurrency(application.applicationInfo.loanAmount)}</div>
            </div>
            <div class="info-item">
              <div class="label">Tenure</div>
              <div class="value">${application.applicationInfo.tenureMonths} months</div>
            </div>
            <div class="info-item">
              <div class="label">Assigned Officer</div>
              <div class="value">${application.applicationInfo.assignedOfficerName || 'Not assigned'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Applicant Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Full Name</div>
              <div class="value">${application.applicantIdentity.personalDetails.fullName}</div>
            </div>
            <div class="info-item">
              <div class="label">Email Address</div>
              <div class="value">${application.applicantIdentity.contactInfo.email}</div>
            </div>
            <div class="info-item">
              <div class="label">Phone Number</div>
              <div class="value">${application.applicantIdentity.contactInfo.phone}</div>
            </div>
            <div class="info-item">
              <div class="label">PAN Number</div>
              <div class="value">${application.applicantIdentity.personalDetails.panNumber}</div>
            </div>
            <div class="info-item">
              <div class="label">Date of Birth</div>
              <div class="value">${this.formatDateOnly(application.applicantIdentity.personalDetails.dateOfBirth)}</div>
            </div>
            <div class="info-item">
              <div class="label">Marital Status</div>
              <div class="value">${application.applicantIdentity.personalDetails.maritalStatus}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Address Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Current Address</div>
              <div class="value">${application.applicantIdentity.personalDetails.addresses.currentAddress}, ${application.applicantIdentity.personalDetails.addresses.city}, ${application.applicantIdentity.personalDetails.addresses.state} - ${application.applicantIdentity.personalDetails.addresses.pincode}</div>
            </div>
            <div class="info-item">
              <div class="label">Permanent Address</div>
              <div class="value">${application.applicantIdentity.personalDetails.addresses.permanentAddress}, ${application.applicantIdentity.personalDetails.addresses.city}, ${application.applicantIdentity.personalDetails.addresses.state} - ${application.applicantIdentity.personalDetails.addresses.pincode}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Employment & Financial Details</div>
          <div class="info-grid-3">
            <div class="info-item">
              <div class="label">Company Name</div>
              <div class="value">${application.employmentDetails.companyName}</div>
            </div>
            <div class="info-item">
              <div class="label">Designation</div>
              <div class="value">${application.employmentDetails.designation}</div>
            </div>
            <div class="info-item">
              <div class="label">Employment Type</div>
              <div class="value">${application.employmentDetails.employmentType}</div>
            </div>
            <div class="info-item">
              <div class="label">Monthly Income</div>
              <div class="value">${this.formatCurrency(application.employmentDetails.monthlyIncome)}</div>
            </div>
            <div class="info-item">
              <div class="label">Annual Income</div>
              <div class="value">${this.formatCurrency(application.employmentDetails.annualIncome)}</div>
            </div>
            <div class="info-item">
              <div class="label">Work Experience</div>
              <div class="value">${application.employmentDetails.workExperience}</div>
            </div>
            <div class="info-item">
              <div class="label">Monthly Expenses</div>
              <div class="value">${this.formatCurrency(application.employmentDetails.monthlyExpenses)}</div>
            </div>
            <div class="info-item">
              <div class="label">Existing Loan EMI</div>
              <div class="value">${application.employmentDetails.existingLoanEmi > 0 ? this.formatCurrency(application.employmentDetails.existingLoanEmi) : 'No existing loans'}</div>
            </div>
            <div class="info-item">
              <div class="label">Credit Card Outstanding</div>
              <div class="value">${application.employmentDetails.creditCardOutstanding > 0 ? this.formatCurrency(application.employmentDetails.creditCardOutstanding) : 'No outstanding debt'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Banking Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Bank Name</div>
              <div class="value">${application.employmentDetails.bankDetails.bankName}</div>
            </div>
            <div class="info-item">
              <div class="label">Account Number</div>
              <div class="value">${application.employmentDetails.bankDetails.accountNumber}</div>
            </div>
            <div class="info-item">
              <div class="label">IFSC Code</div>
              <div class="value">${application.employmentDetails.bankDetails.ifscCode}</div>
            </div>
            <div class="info-item">
              <div class="label">Branch Name</div>
              <div class="value">${application.employmentDetails.bankDetails.branchName}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Financial Assessment</div>
          <div class="info-grid-3">
            <div class="info-item">
              <div class="label">Risk Level</div>
              <div class="value">
                <span class="risk-${application.financialAssessment.riskAssessment.riskLevel.toLowerCase()}">${application.financialAssessment.riskAssessment.riskLevel}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Risk Score</div>
              <div class="value">${application.financialAssessment.riskAssessment.fraudScore !== null && application.financialAssessment.riskAssessment.fraudScore !== undefined && application.financialAssessment.riskAssessment.fraudScore > 0 ? application.financialAssessment.riskAssessment.fraudScore : 'Not calculated'}</div>
            </div>
            <div class="info-item">
              <div class="label">Credit Score</div>
              <div class="value">${application.externalVerification?.creditScore || 'Not available'}</div>
            </div>
            <div class="info-item">
              <div class="label">EMI to Income Ratio</div>
              <div class="value">${application.financialAssessment.calculatedRatios.emiToIncomeRatio.toFixed(2)}%</div>
            </div>
            <div class="info-item">
              <div class="label">Affordability Status</div>
              <div class="value">${application.financialAssessment.calculatedRatios.affordabilityStatus}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Loan Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Purpose</div>
              <div class="value">${application.applicationInfo.purpose}</div>
            </div>
            <div class="info-item">
              <div class="label">Estimated EMI</div>
              <div class="value">${this.formatCurrency(application.financialAssessment.loanDetails.estimatedEmi)}</div>
            </div>
            <div class="info-item">
              <div class="label">Interest Rate</div>
              <div class="value">${application.financialAssessment.loanDetails.estimatedInterestRate}% per annum</div>
            </div>
            <div class="info-item">
              <div class="label">Submitted Date</div>
              <div class="value">${this.formatDate(application.applicationInfo.submittedAt)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Verification Status</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Identity Verification</div>
              <div class="value">
                <span class="status status-${application.applicantIdentity.verificationStatus.identityVerified ? 'verified' : 'pending'}">${application.applicantIdentity.verificationStatus.identityVerified ? 'VERIFIED' : 'PENDING'}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Address Verification</div>
              <div class="value">
                <span class="status status-${application.applicantIdentity.verificationStatus.addressVerified ? 'verified' : 'pending'}">${application.applicantIdentity.verificationStatus.addressVerified ? 'VERIFIED' : 'PENDING'}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Employment Verification</div>
              <div class="value">
                <span class="status status-${application.employmentDetails.verificationStatus.employmentVerified ? 'verified' : 'pending'}">${application.employmentDetails.verificationStatus.employmentVerified ? 'VERIFIED' : 'PENDING'}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Income Verification</div>
              <div class="value">
                <span class="status status-${application.employmentDetails.verificationStatus.incomeVerified ? 'verified' : 'pending'}">${application.employmentDetails.verificationStatus.incomeVerified ? 'VERIFIED' : 'PENDING'}</span>
              </div>
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
          <p><strong>Loanify - Admin Portal</strong></p>
          <p>This is a confidential document generated for administrative purposes.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
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

  /**
   * View document in new tab
   */
  viewDocument(doc: any): void {
    window.open(doc.fileUrl, '_blank');
  }

  /**
   * Download document - only show notification after successful download
   */
  downloadDocument(doc: any): void {
    // Fetch the file as blob
    fetch(doc.fileUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.fileName || 'document.pdf';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        // Only show notification after successful download
        this.notificationService.success('Download Complete', `${doc.fileName} downloaded successfully`);
      })
      .catch(error => {
        console.error('Download error:', error);
        this.notificationService.error('Download Failed', 'Failed to download document. Opening in new tab instead.');
        window.open(doc.fileUrl, '_blank');
      });
  }

  /**
   * Utility functions for PDF generation
   */
  getDocumentTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'AADHAAR_CARD': 'Aadhaar Card',
      'PAN_CARD': 'PAN Card',
      'PHOTOGRAPH': 'Photograph',
      'VOTER_ID': 'Voter ID',
      'DRIVING_LICENSE': 'Driving License',
      'UTILITY_BILL': 'Utility Bill',
      'RENTAL_AGREEMENT': 'Rental Agreement',
      'BUSINESS_REGISTRATION': 'Business Registration',
      'GST_CERTIFICATE': 'GST Certificate',
      'BUSINESS_ITR': 'Business ITR',
      'FINANCIAL_STATEMENT': 'Financial Statement',
      'PROFIT_LOSS_STATEMENT': 'Profit & Loss Statement',
      'BALANCE_SHEET': 'Balance Sheet',
      'BUSINESS_BANK_STATEMENT': 'Business Bank Statement',
      'BANK_STATEMENT': 'Bank Statement',
      'SALARY_SLIP': 'Salary Slip',
      'EMPLOYMENT_CERTIFICATE': 'Employment Certificate',
      'FORM_16': 'Form 16',
      'ITR_FORM': 'ITR Form'
    };
    return typeMap[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getLoanTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'PERSONAL_LOAN': 'Personal Loan',
      'HOME_LOAN': 'Home Loan',
      'BUSINESS_LOAN': 'Business Loan',
      'CAR_LOAN': 'Car Loan',
      'EDUCATION_LOAN': 'Education Loan',
      'GOLD_LOAN': 'Gold Loan',
      'LOAN_AGAINST_PROPERTY': 'Loan Against Property',
      'WORKING_CAPITAL_LOAN': 'Working Capital Loan',
      'EQUIPMENT_FINANCE': 'Equipment Finance',
      'CROP_LOAN': 'Crop Loan',
      'TWO_WHEELER_LOAN': 'Two Wheeler Loan',
      'COMMERCIAL_VEHICLE_LOAN': 'Commercial Vehicle Loan',
      'OVERDRAFT_FACILITY': 'Overdraft Facility',
      'CREDIT_CARD': 'Credit Card',
      'SALARY_ADVANCE': 'Salary Advance',
      'PROPERTY_LOAN': 'Property Loan',
      'FARM_EQUIPMENT_LOAN': 'Farm Equipment Loan',
      'PROFESSIONAL_COURSE_LOAN': 'Professional Course Loan'
    };
    return typeMap[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}
