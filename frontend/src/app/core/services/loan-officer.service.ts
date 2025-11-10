import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OfficerDashboardResponse,
  LoanApplicationSummaryOfficer,
  RecentActivityOfficer,
  LoanApplicationResponse,
  CompleteApplicationDetailsResponse,
  ApplicationInfo,
  ApplicantIdentity,
  PersonalDetailsNested,
  AddressInfo,
  ContactInfo,
  VerificationStatusType,
  EmploymentDetails,
  CompanyContact,
  BankDetails,
  EmploymentVerificationStatus,
  FinancialAssessment,
  LoanDetails,
  ExistingLoan,
  CalculatedRatios,
  RiskAssessment,
  VerificationSummary,
  PersonalDetails,
  FinancialDetails,
  DocumentInfo,
  ExternalVerificationInfo,
  AuditEntry,
  DocumentVerificationRequest,
  DocumentResubmissionRequest,
  DocumentResubmissionResponse,
  LoanDecisionRequest,
  LoanDecisionResponse,
  ComplianceFlagRequest,
  ExternalVerificationResponse
} from '../models/officer.model';


@Injectable({
  providedIn: 'root'
})
export class LoanOfficerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/officer`;

  /**
   * Get loan officer dashboard with statistics
   */
  getDashboard(): Observable<OfficerDashboardResponse> {
    return this.http.get<OfficerDashboardResponse>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get applications assigned to current officer
   */
  getAssignedApplications(): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}/assigned-applications`);
  }

  /**
   * Get specific application for review
   */
  getApplicationForReview(applicationId: string): Observable<LoanApplicationResponse> {
    return this.http.get<LoanApplicationResponse>(`${this.apiUrl}/applications/${applicationId}`);
  }

  /**
   * Get complete application details with all sections
   */
  getCompleteApplicationDetails(applicationId: string): Observable<CompleteApplicationDetailsResponse> {
    return this.http.get<CompleteApplicationDetailsResponse>(
      `${this.apiUrl}/applications/${applicationId}/complete-details`
    );
  }

  /**
   * Start document verification process
   */
  startDocumentVerification(applicationId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/applications/${applicationId}/start-verification`,
      {}
    );
  }

  /**
   * Complete document verification
   */
  verifyDocuments(
    applicationId: string,
    request: DocumentVerificationRequest
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/applications/${applicationId}/verify-documents`,
      request
    );
  }

  /**
   * Trigger external verification (fraud detection & credit scoring)
   */
  triggerExternalVerification(applicationId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/applications/${applicationId}/trigger-external-verification`,
      {}
    );
  }

  /**
   * Complete external verification and get results
   */
  completeExternalVerification(applicationId: string): Observable<ExternalVerificationResponse> {
    return this.http.post<ExternalVerificationResponse>(
      `${this.apiUrl}/applications/${applicationId}/complete-external-verification`,
      {}
    );
  }

  /**
   * Get applications ready for final decision (EXCLUDES compliance applications)
   */
  getApplicationsReadyForDecision(): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}/ready-for-decision`);
  }

  /**
   * Get all post-compliance applications
   * Includes: FLAGGED_FOR_COMPLIANCE, UNDER_INVESTIGATION, AWAITING_COMPLIANCE_DECISION, READY_FOR_DECISION (from compliance)
   */
  getPostComplianceApplications(): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}/applications/post-compliance`);
  }

  /**
   * Get compliance investigation data for an application
   * Returns the detailed JSON investigation data from compliance team
   */
  getComplianceInvestigationData(applicationId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications/${applicationId}/compliance-investigation`);
  }

  /**
   * Request document resubmission from applicant
   */
  requestDocumentResubmission(
    applicationId: string,
    request: DocumentResubmissionRequest
  ): Observable<DocumentResubmissionResponse> {
    return this.http.post<DocumentResubmissionResponse>(
      `${this.apiUrl}/applications/${applicationId}/request-resubmission`,
      request
    );
  }

  /**
   * Get audit trail for an application
   */
  getAuditTrail(applicationId: string): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(
      `${this.apiUrl}/applications/${applicationId}/audit-trail`
    );
  }

  /**
   * Approve loan application
   */
  approveApplication(
    applicationId: string,
    request: LoanDecisionRequest
  ): Observable<LoanDecisionResponse> {
    return this.http.post<LoanDecisionResponse>(
      `${this.apiUrl}/applications/${applicationId}/approve`,
      request
    );
  }

  /**
   * Reject loan application
   */
  rejectApplication(
    applicationId: string,
    request: LoanDecisionRequest
  ): Observable<LoanDecisionResponse> {
    return this.http.post<LoanDecisionResponse>(
      `${this.apiUrl}/applications/${applicationId}/reject`,
      request
    );
  }

  /**
   * Flag application for compliance review
   */
  flagForCompliance(
    applicationId: string,
    request: ComplianceFlagRequest
  ): Observable<LoanDecisionResponse> {
    return this.http.post<LoanDecisionResponse>(
      `${this.apiUrl}/applications/${applicationId}/flag-for-compliance`,
      request
    );
  }

  /**
   * Helper method to format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Helper method to format date
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get display status for loan officer - freezes compliance statuses
   * Loan officer sees FLAGGED_FOR_COMPLIANCE for all compliance-related statuses
   */
  getDisplayStatus(actualStatus: string): string {
    if (!actualStatus) return '';

    // List of all compliance-related statuses from backend ApplicationStatus enum
    const complianceStatuses = [
      'FLAGGED_FOR_COMPLIANCE',
      'COMPLIANCE_REVIEW',
      'PENDING_COMPLIANCE_DOCS',
      'COMPLIANCE_TIMEOUT',
      'UNDER_INVESTIGATION',
      'AWAITING_COMPLIANCE_DECISION'
    ];

    // If status is any compliance-related status, show as FLAGGED_FOR_COMPLIANCE
    // This "freezes" the status for loan officer during entire compliance process
    if (complianceStatuses.includes(actualStatus)) {
      return 'FLAGGED_FOR_COMPLIANCE';
    }

    return actualStatus;
  }

  /**
   * Helper method to get status badge color
   */
  getStatusBadgeClass(status: string): string {
    const statusColors: { [key: string]: string } = {
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
      'DOCUMENT_VERIFICATION': 'bg-purple-100 text-purple-800',
      'PENDING_EXTERNAL_VERIFICATION': 'bg-orange-100 text-orange-800',
      'READY_FOR_DECISION': 'bg-green-100 text-green-800',
      'APPROVED': 'bg-green-500 text-white',
      'REJECTED': 'bg-red-500 text-white',
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Helper method to get priority badge color
   */
  getPriorityBadgeClass(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'HIGH': 'bg-red-100 text-red-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-blue-100 text-blue-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Helper method to get risk level badge color
   */
  getRiskLevelBadgeClass(riskLevel: string): string {
    const riskColors: { [key: string]: string } = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-red-100 text-red-800'
    };
    return riskColors[riskLevel] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format date and time for display
   */
  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
