import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface ApplicationSummary {
  id: string;
  // Loan Details
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  existingLoans: boolean;
  existingEmi?: number;
  
  // Personal Info
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  
  // Status
  status: string;
  hasPersonalDetails: boolean;
  hasFinancialProfile: boolean;
  
  // Employment
  employmentType?: string;
  
  // Documents
  documentsCount: number;
  
  // Timestamps
  createdAt: Date;
  submittedAt?: Date;
}

interface FinancialDetails {
  employerName?: string;
  designation?: string;
  employmentType?: string;
  primaryMonthlyIncome?: number;
  additionalIncome?: number;
  monthlyExpenses?: number;
  bankName?: string;
  accountNumber?: string;
}

interface DocumentInfo {
  id: number;
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

@Component({
  selector: 'app-application-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-summary.component.html',
  styleUrl: './application-summary.component.css'
})
export class ApplicationSummaryComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  applicationId = signal<string>('');
  employmentType = signal<string>('SALARIED'); // Store employment type from query params
  application = signal<ApplicationSummary | null>(null);
  financialDetails = signal<FinancialDetails | null>(null);
  documents = signal<DocumentInfo[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  agreedToTerms = signal<boolean>(false);

  // Computed values
  monthlyEMI = computed(() => {
    const app = this.application();
    if (!app) return 0;
    
    // Calculate EMI using formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    const P = app.requestedAmount;
    const n = app.tenureMonths;
    const annualRate = this.getInterestRate(app.loanType);
    const r = annualRate / 12 / 100; // Monthly interest rate
    
    if (r === 0) return P / n; // If no interest
    
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  });

  totalPayable = computed(() => {
    const emi = this.monthlyEMI();
    const app = this.application();
    if (!app) return 0;
    return emi * app.tenureMonths;
  });

  totalInterest = computed(() => {
    const total = this.totalPayable();
    const app = this.application();
    if (!app) return 0;
    return total - app.requestedAmount;
  });

  isComplete = computed(() => {
    const app = this.application();
    if (!app) return false;
    // Use actual documents length instead of documentsCount which may be stale
    return app.hasPersonalDetails && app.hasFinancialProfile && this.documents().length > 0;
  });

  ngOnInit(): void {
    this.applicationId.set(this.route.snapshot.queryParams['applicationId'] || '');
    
    // Get employment type from query params (if coming from document upload)
    const empType = this.route.snapshot.queryParams['employmentType'];
    if (empType) {
      this.employmentType.set(empType);
    }
    
    if (!this.applicationId()) {
      this.notificationService.error('Error', 'Application ID not found');
      this.router.navigate(['/applicant/dashboard']);
      return;
    }

    this.loadApplicationData();
    this.loadDocuments();
  }

  /**
   * Load application data from backend
   */
  private loadApplicationData(): void {
    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(
      `${environment.apiUrl}/loan-application/${this.applicationId()}`,
      { headers }
    ).subscribe({
      next: (data) => {
        this.application.set({
          id: data.id,
          loanType: data.loanType,
          requestedAmount: data.requestedAmount,
          tenureMonths: data.tenureMonths,
          purpose: data.purpose,
          existingLoans: data.existingLoans,
          existingEmi: data.existingEmi,
          applicantName: data.applicantName,
          applicantEmail: data.applicantEmail,
          applicantPhone: data.applicantPhone,
          status: data.status,
          hasPersonalDetails: data.hasPersonalDetails,
          hasFinancialProfile: data.hasFinancialProfile,
          employmentType: data.employmentType,
          documentsCount: data.documentsCount,
          createdAt: new Date(data.createdAt),
          submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined
        });
        
        // Update employmentType signal if available from backend
        if (data.employmentType) {
          this.employmentType.set(data.employmentType);
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Failed to load application:', error);
        this.notificationService.error('Error', 'Failed to load application details');
      }
    });
  }

  /**
   * Load documents list
   */
  private loadDocuments(): void {
    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/documents`,
      { headers }
    ).subscribe({
      next: (data) => {
        this.documents.set(data.map(doc => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          uploadedAt: new Date(doc.uploadedAt)
        })));
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
      }
    });
  }

  /**
   * Get interest rate for loan type
   */
  private getInterestRate(loanType: string): number {
    const rates: { [key: string]: number } = {
      'PERSONAL_LOAN': 10.5,
      'HOME_LOAN': 8.5,
      'CAR_LOAN': 9.0,
      'TWO_WHEELER_LOAN': 11.0,
      'EDUCATION_LOAN': 7.5,
      'BUSINESS_LOAN': 12.0,
      'GOLD_LOAN': 7.0,
      'PROPERTY_LOAN': 9.5
    };
    return rates[loanType] || 10.0;
  }

  /**
   * Get display name for loan type
   */
  getLoanTypeName(type: string): string {
    const names: { [key: string]: string } = {
      'PERSONAL_LOAN': 'Personal Loan',
      'HOME_LOAN': 'Home Loan',
      'CAR_LOAN': 'Car Loan',
      'TWO_WHEELER_LOAN': 'Two Wheeler Loan',
      'EDUCATION_LOAN': 'Education Loan',
      'BUSINESS_LOAN': 'Business Loan',
      'GOLD_LOAN': 'Gold Loan',
      'PROPERTY_LOAN': 'Property Loan'
    };
    return names[type] || type;
  }

  /**
   * Get document type display name
   */
  getDocumentTypeName(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get employment type display name
   */
  getEmploymentTypeDisplay(type: string): string {
    const types: { [key: string]: string } = {
      'SALARIED': 'Salaried Employee',
      'SELF_EMPLOYED': 'Self Employed',
      'BUSINESS_OWNER': 'Business Owner'
    };
    return types[type] || type;
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
   * Edit section
   */
  editSection(section: string): void {
    const appId = this.applicationId();
    
    switch(section) {
      case 'loan':
        this.router.navigate(['/applicant/apply-loan'], {
          queryParams: { applicationId: appId }
        });
        break;
      case 'personal':
        this.router.navigate(['/applicant/personal-details']);
        break;
      case 'employment':
        this.router.navigate(['/applicant/employment-details'], {
          queryParams: { applicationId: appId }
        });
        break;
      case 'documents':
        // Pass employmentType to ensure correct document categories are shown
        this.router.navigate(['/applicant/document-upload'], {
          queryParams: { 
            applicationId: appId,
            employmentType: this.employmentType()
          }
        });
        break;
    }
  }

  /**
   * Toggle terms agreement
   */
  toggleTerms(): void {
    this.agreedToTerms.set(!this.agreedToTerms());
  }

  /**
   * Submit application for review
   */
  submitApplication(): void {
    if (!this.isComplete()) {
      this.notificationService.warning('Incomplete', 'Please complete all sections before submitting');
      return;
    }

    if (!this.agreedToTerms()) {
      this.notificationService.warning('Terms Required', 'Please agree to terms and conditions');
      return;
    }

    this.isSubmitting.set(true);

    const token = this.authService.getStoredToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Submit application - just update status
    this.http.post<any>(
      `${environment.apiUrl}/loan-application/${this.applicationId()}/submit`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.notificationService.success('Success', 'Application submitted successfully!');
        
        // Navigate to success page
        this.router.navigate(['/applicant/dashboard'], {
          queryParams: { submitted: 'true' }
        });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Failed to submit application:', error);
        this.notificationService.error('Error', error.error?.message || 'Failed to submit application');
      }
    });
  }

  /**
   * Go back to dashboard
   */
  backToDashboard(): void {
    this.router.navigate(['/applicant/dashboard']);
  }
}
