import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// We'll create these models later
export interface LoanApplicationRequest {
  loanType: string;
  requestedAmount: number;
  purpose: string;
  tenure: number;
}

export interface LoanApplicationResponse {
  id: string;
  applicantId: string;
  loanType: string;
  requestedAmount: number;
  purpose: string;
  tenure: number;
  status: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
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
  createApplication(applicationData: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.apiService.post<LoanApplicationResponse>('/loan-application/create', applicationData);
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
   * Update personal details for application
   */
  updatePersonalDetails(applicationId: string, personalData: any): Observable<any> {
    return this.apiService.put(`/loan-application/${applicationId}/personal-details`, personalData);
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
    return this.apiService.get('/loan-application/profile-status');
  }

  /**
   * Create/Update personal details (not tied to specific application)
   */
  createPersonalDetails(personalData: any): Observable<any> {
    return this.apiService.post('/loan-application/personal-details', personalData);
  }

  /**
   * Get resubmission requirements
   */
  getResubmissionRequirements(applicationId: string): Observable<any> {
    return this.apiService.get(`/loan-application/${applicationId}/resubmission-requirements`);
  }
}
