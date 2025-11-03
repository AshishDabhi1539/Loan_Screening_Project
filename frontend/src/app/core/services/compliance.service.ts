import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

/**
 * Compliance Dashboard Response
 */
export interface ComplianceDashboardResponse {
  // Officer Information
  officerId: string;
  officerName: string;
  officerEmail: string;
  role: string;
  
  // Workload Statistics
  totalAssignedApplications: number;
  flaggedForCompliance: number;
  underComplianceReview: number;
  pendingComplianceDocs: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  
  // Priority Breakdown
  criticalPriorityApplications: number;
  highPriorityApplications: number;
  mediumPriorityApplications: number;
  lowPriorityApplications: number;
  
  // Performance Metrics
  averageResolutionTimeHours: number;
  totalCasesResolved: number;
  complianceViolationsFound: number;
  applicationsClearedToday: number;
  
  // Recent Activity
  recentActivities: RecentComplianceActivity[];
  
  // System Statistics
  totalSystemFlaggedApplications: number;
  availableComplianceOfficers: number;
  hasCapacityForNewCases: boolean;
  
  // Dashboard Metadata
  lastUpdated: string;
  dashboardVersion: string;
}

export interface RecentComplianceActivity {
  applicationId: string;
  applicantName: string;
  action: string;
  status: string;
  flagReason: string;
  priority: string;
  timestamp: string;
  description: string;
}

/**
 * Loan Application Response
 */
export interface LoanApplicationResponse {
  id: string;
  applicationNumber: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  loanType: string;
  requestedAmount: number;
  status: string;
  priority: string;
  flagReason?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  submittedAt?: string;
  lastUpdated: string;
}

/**
 * Compliance Decision Request
 */
export interface ComplianceDecisionRequest {
  decisionType: 'CLEARED' | 'REJECTED' | 'ESCALATE' | 'REQUEST_DOCUMENTS';
  decisionNotes: string;
  additionalNotes?: string;
  complianceViolationType?: string;
  recommendedAction?: string;
  requiresRegulatoryReporting?: boolean;
  escalationReason?: string;
}

/**
 * Compliance Decision Response
 */
export interface ComplianceDecisionResponse {
  applicationId: string;
  decision: string;
  newStatus: string;
  decisionNotes: string;
  processedBy: string;
  processedAt: string;
  message: string;
}

/**
 * Legacy placeholder (do not use)
 */
export interface LegacyComplianceDocumentRequest {
  documentTypes: string[];
  requestReason: string;
  deadline?: string;
  additionalNotes?: string;
}

/**
 * Compliance Investigation Response
 */
export interface ComplianceInvestigationResponse {
  investigationId: string;
  investigationDate: string;
  applicantProfile: any;
  overallAssessment: any;
  bank_details: any;
  fraud_records: any;
  loan_history: any;
  consolidatedFindings: any;
}

export interface ComplianceDocumentRequest {
  requiredDocumentTypes: string[];
  requestReason: string;
  additionalInstructions?: string;
  deadlineDays: number;
  priorityLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  isMandatory: boolean;
  complianceCategory?: string;
}

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
}
