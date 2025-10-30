import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Import models (will create next)
export interface OfficerDashboardResponse {
  totalAssigned: number;
  pendingReview: number;
  underVerification: number;
  readyForDecision: number;
  completedToday: number;
  avgProcessingTime: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  recentApplications: LoanApplicationSummary[];
  recentActivities: RecentActivity[];
}

export interface LoanApplicationSummary {
  id: string;
  applicantName: string;
  applicantEmail: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  status: string;
  priority: string;
  submittedAt: Date;
  assignedAt: Date;
}

export interface RecentActivity {
  id: string;
  action: string;
  applicantName: string;
  applicationId: string;
  timestamp: Date;
  status: string;
}

export interface LoanApplicationResponse {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  existingLoans: boolean;
  existingEmi?: number;
  status: string;
  priority: string;
  riskLevel: string;
  submittedAt: Date;
  assignedAt?: Date;
  hasPersonalDetails: boolean;
  hasFinancialProfile: boolean;
  documentsCount: number;
  verifiedDocumentsCount: number;
  fraudCheckResultsCount: number;
}

export interface CompleteApplicationDetailsResponse {
  application: LoanApplicationResponse;
  personalDetails: PersonalDetails;
  financialDetails: FinancialDetails;
  documents: DocumentInfo[];
  externalVerification?: ExternalVerificationInfo;
  auditTrail: AuditEntry[];
}

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  spouseName?: string;
  panNumber: string;
  aadhaarNumber: string;
  currentAddressLine1: string;
  currentAddressLine2?: string;
  currentCity: string;
  currentState: string;
  currentPincode: string;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPincode?: string;
  alternatePhoneNumber?: string;
  dependentsCount?: number;
}

export interface FinancialDetails {
  employmentType: string;
  companyName?: string;
  jobTitle?: string;
  employmentStartDate?: string;
  companyAddress?: string;
  monthlyIncome: number;
  additionalIncome?: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  existingEmi?: number;
  creditCardOutstanding?: number;
  otherObligations?: number;
  foir?: number;
}

export interface DocumentInfo {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  verificationStatus: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface ExternalVerificationInfo {
  creditScore: number | null;
  riskScore: string;
  riskScoreNumeric: number;
  fraudScore: number;
  riskFactors: string;
  creditScoreReason?: string;
  redAlertFlag: boolean;
  recommendedAction: string;
  verifiedAt: Date;
  dataFound: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: string;
  status?: string;
}

export interface DocumentVerificationRequest {
  verifiedDocuments: string[];
  rejectedDocuments: {
    documentType: string;
    rejectionReason: string;
  }[];
  verificationNotes?: string;
}

export interface DocumentResubmissionRequest {
  requiredDocuments: string[];
  resubmissionReason: string;
  additionalInstructions?: string;
  dueDate?: string;
}

export interface DocumentResubmissionResponse {
  message: string;
  applicationId: string;
  requiredDocuments: string[];
  dueDate?: string;
  status: string;
}

export interface LoanDecisionRequest {
  approvedAmount?: number;
  approvedTenure?: number;
  approvedInterestRate?: number;
  decisionReason: string;
  conditions?: string[];
  internalNotes?: string;
}

export interface LoanDecisionResponse {
  message: string;
  applicationId: string;
  status: string;
  decisionType: string;
  decisionMaker: string;
  decisionMakerName: string;
  decisionDate: Date;
  nextStep?: string;
  nextStepUrl?: string;
}

export interface ComplianceFlagRequest {
  flagReason: string;
  suspiciousActivities: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  additionalEvidence?: string;
}

export interface ExternalVerificationResponse {
  creditScore: number | null;
  riskScore: string;
  riskScoreNumeric: number;
  fraudScore: number;
  riskFactors: string;
  creditScoreReason?: string;
  redAlertFlag: boolean;
  recommendedAction: string;
  dataFound: boolean;
  verificationDate: Date;
}

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
   * Get applications ready for final decision
   */
  getApplicationsReadyForDecision(): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}/ready-for-decision`);
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
}
