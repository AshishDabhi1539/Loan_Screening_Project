import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import {
  ComplianceDashboardResponse,
  RecentComplianceActivity,
  LoanApplicationResponse,
  ComplianceDecisionRequest,
  ComplianceDecisionResponse,
  OfficerDetailsResponse,
  OfficerPersonalDetailsResponse,
  OfficerProfileResponse,
  ComplianceInvestigationResponse,
  ComplianceDocumentRequest,
  LegacyComplianceDocumentRequest
} from '../models/compliance.model';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private readonly BASE_URL = '/compliance';

  /**
   * Get compliance officer dashboard
   */
  getDashboard(): Observable<ComplianceDashboardResponse> {
    return this.apiService.get<ComplianceDashboardResponse>(`${this.BASE_URL}/dashboard`);
  }

  /**
   * Get assigned applications
   */
  getAssignedApplications(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>(`${this.BASE_URL}/assigned-applications`);
  }

  /**
   * Get flagged applications
   */
  getFlaggedApplications(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>(`${this.BASE_URL}/flagged-applications`);
  }

  /**
   * Get applications under review
   */
  getApplicationsUnderReview(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>(`${this.BASE_URL}/under-review`);
  }

  /**
   * Get applications pending documents
   */
  getApplicationsPendingDocuments(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>(`${this.BASE_URL}/pending-documents`);
  }

  /**
   * Get application for review
   */
  getApplicationForReview(applicationId: string): Observable<LoanApplicationResponse> {
    return this.apiService.get<LoanApplicationResponse>(`${this.BASE_URL}/applications/${applicationId}`);
  }

  /**
   * Get complete application details
   */
  getCompleteApplicationDetails(applicationId: string): Observable<any> {
    return this.apiService.get<any>(`${this.BASE_URL}/applications/${applicationId}/complete-details`);
  }

  /**
   * Start compliance investigation
   * Note: Backend returns plain text, so we use HttpClient directly with responseType: 'text'
   */
  startInvestigation(applicationId: string): Observable<string> {
    const url = `${environment.apiUrl}${this.BASE_URL}/applications/${applicationId}/start-investigation`;
    
    // Use HttpClient directly to handle text/plain response
    // responseType: 'text' returns Observable<string> directly
    const response = this.http.post(url, {}, { 
      responseType: 'text'
    }) as Observable<string>;
    
    return response.pipe(
      map((text: string) => text || 'Investigation started successfully')
    );
  }

  /**
   * Perform comprehensive investigation
   */
  performComprehensiveInvestigation(applicationId: string): Observable<ComplianceInvestigationResponse> {
    return this.apiService.post<ComplianceInvestigationResponse>(`${this.BASE_URL}/applications/${applicationId}/investigate`, {});
  }

  /**
   * Request additional documents via existing officer resubmission endpoint
   */
  requestAdditionalDocuments(
    applicationId: string,
    payload: ComplianceDocumentRequest
  ): Observable<string> {
    // Backend returns plain text; use HttpClient with responseType 'text'
    const url = `${environment.apiUrl}${this.BASE_URL}/applications/${applicationId}/request-documents`;
    const resp = this.http.post(url, payload, { responseType: 'text' }) as Observable<string>;
    return resp.pipe(map(text => text || 'Compliance document request sent successfully'));
  }

  /**
   * Submit compliance-only document verification decisions
   * Reuses a compliance endpoint expected on backend
   */
  /**
   * Track document view by compliance officer
   */
  trackDocumentView(documentId: number): Observable<string> {
    return this.apiService.post<string>(`${environment.apiUrl}${this.BASE_URL}/documents/${documentId}/track-view`, {});
  }

  /**
   * Verify a single compliance document
   */
  verifySingleComplianceDocument(documentId: number, verified: boolean, notes?: string, rejectionReason?: string): Observable<string> {
    const params = new URLSearchParams();
    params.set('verified', verified.toString());
    if (notes) params.set('notes', notes);
    if (rejectionReason) params.set('rejectionReason', rejectionReason);
    
    // apiService.post already prepends environment.apiUrl, so we don't need to add it manually
    return this.apiService.post<string>(`${this.BASE_URL}/documents/${documentId}/verify?${params.toString()}`, {});
  }

  verifyComplianceDocuments(applicationId: string, body: {
    documentVerifications: Array<{ documentId: string; verified: boolean; verificationNotes?: string; rejectionReason?: string }>;
    generalNotes?: string;
  }): Observable<any> {
    const url = `${this.BASE_URL}/applications/${applicationId}/verify-documents`;
    return this.apiService.post<any>(url, body);
  }

  /**
   * Request compliance documents
   */
  requestDocuments(applicationId: string, request: ComplianceDocumentRequest): Observable<string> {
    return this.apiService.post<string>(`${this.BASE_URL}/applications/${applicationId}/request-documents`, request);
  }

  /**
   * Get compliance document request details for an application
   * Returns the requested document types to identify compliance-requested documents
   */
  getComplianceDocumentRequestDetails(applicationId: string): Observable<{
    requestId?: number;
    requiredDocumentTypes: string[];
    requestReason?: string;
    additionalInstructions?: string;
    requestedAt?: string;
    status?: string;
    deadlineDays?: number;
    priorityLevel?: string;
    isMandatory?: boolean;
    complianceCategory?: string;
  }> {
    return this.apiService.get(`${this.BASE_URL}/applications/${applicationId}/document-request-details`);
  }

  /**
   * Clear compliance
   */
  clearCompliance(applicationId: string, request: ComplianceDecisionRequest): Observable<ComplianceDecisionResponse> {
    return this.apiService.post<ComplianceDecisionResponse>(`${this.BASE_URL}/applications/${applicationId}/clear-compliance`, request);
  }

  /**
   * Reject for compliance
   */
  rejectForCompliance(applicationId: string, request: ComplianceDecisionRequest): Observable<ComplianceDecisionResponse> {
    return this.apiService.post<ComplianceDecisionResponse>(`${this.BASE_URL}/applications/${applicationId}/reject-compliance`, request);
  }

  /**
   * Escalate to senior
   */
  escalateToSenior(applicationId: string, request: ComplianceDecisionRequest): Observable<string> {
    return this.apiService.post<string>(`${this.BASE_URL}/applications/${applicationId}/escalate`, request);
  }

  /**
   * Quick clear compliance
   */
  quickClearCompliance(applicationId: string, request: ComplianceDecisionRequest): Observable<ComplianceDecisionResponse> {
    return this.apiService.post<ComplianceDecisionResponse>(`${this.BASE_URL}/applications/${applicationId}/quick-clear`, request);
  }

  /**
   * Quick reject compliance
   */
  quickRejectCompliance(applicationId: string, request: ComplianceDecisionRequest): Observable<ComplianceDecisionResponse> {
    return this.apiService.post<ComplianceDecisionResponse>(`${this.BASE_URL}/applications/${applicationId}/quick-reject`, request);
  }

  /**
   * Handle document submission
   */
  handleDocumentSubmission(applicationId: string): Observable<string> {
    return this.apiService.post<string>(`${this.BASE_URL}/applications/${applicationId}/documents-received`, {});
  }

  /**
   * Process compliance timeout
   */
  processTimeout(applicationId: string): Observable<string> {
    return this.apiService.post<string>(`${this.BASE_URL}/applications/${applicationId}/process-timeout`, {});
  }

  /**
   * Trigger decision process - moves application to AWAITING_COMPLIANCE_DECISION status
   */
  triggerDecision(applicationId: string, request: { summaryNotes: string }): Observable<string> {
    return this.apiService.post<string>(`${this.BASE_URL}/applications/${applicationId}/trigger-decision`, request);
  }

  /**
   * Get applications awaiting compliance decision
   */
  getApplicationsAwaitingDecision(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>(`${this.BASE_URL}/applications/awaiting-decision`);
  }

  /**
   * Submit compliance decision (approve/reject) with notes to loan officer
   */
  submitComplianceDecision(applicationId: string, request: { decision: string; notesToLoanOfficer: string }): Observable<ComplianceDecisionResponse> {
    return this.apiService.post<ComplianceDecisionResponse>(`${this.BASE_URL}/applications/${applicationId}/submit-decision`, request);
  }

  /**
   * Get completed applications (applications that compliance has finished processing)
   */
  getCompletedApplications(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>(`${this.BASE_URL}/applications/completed`);
  }

  /** Officer profile details */
  getOfficerDetails(): Observable<OfficerDetailsResponse> {
    return this.apiService.get<OfficerDetailsResponse>(`${this.BASE_URL}/me/details`);
  }

  getOfficerPersonalDetails(): Observable<OfficerPersonalDetailsResponse> {
    return this.apiService.get<OfficerPersonalDetailsResponse>(`${this.BASE_URL}/me/personal-details`);
  }

  /** Combined profile */
  getOfficerProfile(): Observable<OfficerProfileResponse> {
    return this.apiService.get<OfficerProfileResponse>(`${this.BASE_URL}/me/profile`);
  }

  /**
   * Upload profile photo
   */
  uploadProfilePhoto(file: File): Observable<string> {
    return this.apiService.uploadFile<string>(`${this.BASE_URL}/me/profile-photo`, file);
  }
}
