import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// Loan Application Request (matches backend LoanApplicationRequest.java)
export interface LoanApplicationRequest {
  loanType: string;  // LoanType enum
  loanAmount: number;  // Backend uses loanAmount, not requestedAmount
  tenureMonths: number;  // Backend uses tenureMonths
  purpose: string;
  additionalNotes?: string;
}

// Loan Application Create Response (matches backend LoanApplicationCreateResponse.java)
export interface LoanApplicationCreateResponse {
  id: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  status: string;
  message: string;
  createdAt: string;
  nextStep: string;
  nextStepUrl: string;
}

// Full Loan Application Response
export interface LoanApplicationResponse {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  status: string;
  riskLevel?: string;
  priority?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadResponse {
  id: number;
  fileName: string;
  documentType: string;
  uploadedAt: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoanApplicationService {
  private apiService = inject(ApiService);

  /**
   * Create new loan application
   */
  createApplication(applicationData: LoanApplicationRequest): Observable<LoanApplicationCreateResponse> {
    return this.apiService.post<LoanApplicationCreateResponse>('/loan-application/create', applicationData);
  }

  /**
   * Get all applications for current user
   */
  getMyApplications(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>('/loan-application/my-applications');
  }

  /**
   * Get application by ID
   */
  getApplicationById(applicationId: string): Observable<LoanApplicationResponse> {
    return this.apiService.get<LoanApplicationResponse>(`/loan-application/${applicationId}`);
  }

  /**
   * Download application PDF
   */
  downloadApplicationPdf(applicationId: string): Observable<Blob> {
    return this.apiService.downloadFile(`/loan-application/${applicationId}/export/pdf`);
  }

  /**
   * Download receipt (if supported by backend)
   */
  downloadReceipt(applicationId: string): Observable<Blob> {
    return this.apiService.downloadFile(`/loan-application/${applicationId}/receipt`);
  }

  /**
   * Update personal details for application (now uses global profile endpoint)
   */
  updatePersonalDetails(applicationId: string, personalData: any): Observable<any> {
    // Personal details are now managed globally, not per application
    return this.apiService.put('/applicant/profile/personal-details', personalData);
  }

  /**
   * Create/Update financial details for application
   */
  updateFinancialDetails(applicationId: string, financialData: any): Observable<any> {
    return this.apiService.post(`/loan-application/${applicationId}/financial-details`, financialData);
  }

  /**
   * Upload document for application
   */
  uploadDocument(applicationId: string, file: File, documentType: string): Observable<DocumentUploadResponse> {
    return this.apiService.uploadFile<DocumentUploadResponse>(
      `/loan-application/${applicationId}/documents/upload`,
      file,
      { documentType }
    );
  }

  /**
   * Get documents for application
   */
  getDocuments(applicationId: string): Observable<DocumentUploadResponse[]> {
    return this.apiService.get<DocumentUploadResponse[]>(`/loan-application/${applicationId}/documents`);
  }

  /**
   * Submit application
   */
  submitApplication(applicationId: string): Observable<LoanApplicationResponse> {
    return this.apiService.post<LoanApplicationResponse>(`/loan-application/${applicationId}/submit`);
  }

  /**
   * Get application progress
   */
  getApplicationProgress(applicationId: string): Observable<number> {
    return this.apiService.get<number>(`/loan-application/${applicationId}/progress`);
  }

  /**
   * Check if application is complete
   */
  isApplicationComplete(applicationId: string): Observable<boolean> {
    return this.apiService.get<boolean>(`/loan-application/${applicationId}/complete`);
  }

  /**
   * Get profile status
   */
  getProfileStatus(): Observable<any> {
    return this.apiService.get('/applicant/profile/status');
  }

  /**
   * Create/Update personal details (not tied to specific application)
   */
  createPersonalDetails(personalData: any): Observable<any> {
    return this.apiService.post('/applicant/profile/personal-details', personalData);
  }

  /**
   * Get resubmission requirements
   */
  getResubmissionRequirements(applicationId: string): Observable<any> {
    return this.apiService.get(`/loan-application/${applicationId}/resubmission-requirements`);
  }
}
