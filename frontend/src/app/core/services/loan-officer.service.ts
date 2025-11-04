import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Import models (will create next)
export interface OfficerDashboardResponse {
  // Officer Info
  officerId?: string;
  officerName: string;
  officerEmail: string;
  role: string;
  
  // Application Statistics
  totalAssigned: number;
  verified: number; // Applications that passed verification
  rejected: number; // Applications that were rejected
  inProgress: number; // Applications currently being processed
  completedToday: number;
  completedThisWeek?: number;
  completedThisMonth?: number;
  
  // Performance Metrics
  avgProcessingTime: number;
  applicationsProcessedToday?: number;
  applicationsProcessedThisWeek?: number;
  
  // Priority Breakdown
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  
  // Recent Data
  recentApplications: LoanApplicationSummary[];
  recentActivities: RecentActivity[];
  
  // Workload Status
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  hasCapacityForNewApplications?: boolean;
  maxWorkloadCapacity?: number;
  currentWorkload?: number;
  urgentApplications?: number;
  highValueApplications?: number;
  flaggedApplications?: number;
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
  // Compliance review flags
  fromCompliance?: boolean;
  complianceReviewAcknowledged?: boolean;
  complianceReviewAcknowledgedAt?: Date;
}

export interface CompleteApplicationDetailsResponse {
  applicationInfo: ApplicationInfo;
  applicantIdentity: ApplicantIdentity;
  employmentDetails: EmploymentDetails;
  documents: DocumentInfo[];
  financialAssessment: FinancialAssessment;
  verificationSummary: VerificationSummary;
  externalVerification: ExternalVerificationInfo | null;
}

export interface ApplicationInfo {
  id: string;
  status: string;
  loanAmount: number;
  tenureMonths: number;
  purpose: string;
  loanType: string;
  submittedAt: Date;
  assignedAt?: Date;
  assignedOfficerName?: string;
  priority: string;
  daysInReview?: number;
  fromCompliance?: boolean;
  complianceNotes?: string;
}

export interface ApplicantIdentity {
  personalDetails: PersonalDetailsNested;
  contactInfo: ContactInfo;
  verificationStatus: VerificationStatus;
}

export interface PersonalDetailsNested {
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  panNumber: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  gender?: string;
  maritalStatus?: string;
  addresses: AddressInfo;
}

export interface AddressInfo {
  permanentAddress: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  alternatePhone?: string;
}

export interface VerificationStatus {
  identityVerified: boolean;
  addressVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  identityVerificationNotes?: string;
}

export interface EmploymentDetails {
  companyName: string;
  designation: string;
  workExperience: string;
  employmentType: string;
  monthlyIncome: number;
  annualIncome: number;
  companyContact: CompanyContact;
  bankDetails: BankDetails;
  verificationStatus: EmploymentVerificationStatus;
  // Financial Obligations
  existingLoanEmi?: number;
  creditCardOutstanding?: number;
  monthlyExpenses?: number;
}

export interface CompanyContact {
  companyPhone?: string;
  companyEmail?: string;
  hrPhone?: string;
  hrEmail?: string;
  managerName?: string;
  managerPhone?: string;
  companyAddress?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
}

export interface EmploymentVerificationStatus {
  employmentVerified: boolean;
  incomeVerified: boolean;
  bankAccountVerified: boolean;
  employmentVerificationNotes?: string;
  incomeVerificationNotes?: string;
  lastVerificationDate?: Date;
}

export interface FinancialAssessment {
  loanDetails: LoanDetails;
  existingLoans: ExistingLoan[];
  calculatedRatios: CalculatedRatios;
  riskAssessment: RiskAssessment;
}

export interface LoanDetails {
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  estimatedEmi: number;
  estimatedInterestRate: number;
}

export interface ExistingLoan {
  loanType: string;
  emiAmount: number;
  outstandingAmount: number;
  bankName: string;
  remainingTenure: number;
}

export interface CalculatedRatios {
  emiToIncomeRatio: number;
  debtToIncomeRatio: number;
  loanToIncomeRatio: number;
  affordabilityStatus: string;
  recommendation: string;
}

export interface RiskAssessment {
  riskLevel: string;
  riskScore: number;
  fraudScore: number;
  riskFactors: string[];
  overallAssessment: string;
}

export interface VerificationSummary {
  identityVerificationComplete: boolean;
  documentVerificationComplete: boolean;
  employmentVerificationComplete: boolean;
  financialVerificationComplete: boolean;
  externalVerificationComplete: boolean;
  overallCompletionPercentage: number;
  currentStage: string;
  nextAction: string;
  pendingItems: string[];
  rejectedItems: string[];
  readyForExternalVerification: boolean;
  readyForDecision: boolean;
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
  documentId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
  verificationStatus: string;
  verificationNotes?: string;
  rejectionReason?: string;
  isRequired: boolean;
  isResubmitted: boolean;
  verifiedAt?: Date;
  verifiedByName?: string;
  fileSizeBytes?: number;
  fileType?: string;
}

export interface ExternalVerificationInfo {
  // Credit Scoring Results
  creditScore: number | null;
  riskLevel: string;             // LOW, MEDIUM, HIGH, INVALID, UNKNOWN
  riskScoreNumeric: number;      // 0-100 numeric risk score
  riskFactors: string;           // Detailed risk factors explanation
  creditScoreReason?: string;
  redAlertFlag: boolean;         // Critical risk indicator
  
  // Financial Metrics
  totalOutstanding: number;      // Total outstanding loan amount
  activeLoansCount: number;      // Number of active loans
  totalMissedPayments: number;   // Total missed payments
  hasDefaults: boolean;          // Loan default history flag
  activeFraudCases: number;      // Active fraud cases count
  
  // Data Availability
  dataFound: boolean;            // Whether external data was found
  
  // Metadata
  recommendedAction: string;     // Recommended action based on scoring
  verifiedAt: Date;
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
  documentVerifications: {
    documentId: string;
    verified: boolean;
    verificationNotes?: string;
    rejectionReason?: string;
  }[];
  identityVerified: boolean;
  identityVerificationNotes?: string;
  employmentVerified: boolean;
  employmentVerificationNotes?: string;
  incomeVerified: boolean;
  incomeVerificationNotes?: string;
  bankAccountVerified: boolean;
  bankAccountVerificationNotes?: string;
  addressVerified: boolean;
  overallVerificationPassed: boolean;
  generalNotes?: string;
}

export interface DocumentResubmissionRequest {
  rejectedDocuments: {
    documentType: string;
    rejectionReason: string;
    requiredAction: string;
    specificInstructions?: string;
    isRequired: boolean;
  }[];
  resubmissionDeadline: string;
  additionalInstructions?: string;
  officerNotes?: string;
}

export interface DocumentResubmissionResponse {
  message: string;
  applicationId: string;
  requiredDocuments: string[];
  dueDate?: string;
  status: string;
}

export interface LoanDecisionRequest {
  decisionType?: 'APPROVED' | 'REJECTED' | 'CONDITIONAL_APPROVAL';
  approvedAmount?: number;
  approvedTenureMonths?: number;
  approvedInterestRate?: number;
  decisionReason?: string;
  rejectionReason?: string;
  additionalNotes?: string;
  requiresComplianceReview?: boolean;
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
  // Application Status
  message: string;
  applicationId: string;
  previousStatus: string;
  newStatus: string;
  completedAt: Date;
  
  // Credit Scoring Results
  creditScore: number | null;
  riskType: string;              // LOW, MEDIUM, HIGH, INVALID, UNKNOWN
  riskScoreNumeric: number;      // 0-100 numeric risk score
  riskFactors: string;           // Detailed risk factors explanation
  creditScoreReason: string;     // Explanation for credit score
  redAlertFlag: boolean;         // Critical risk indicator
  
  // Financial Metrics
  totalOutstanding: number;      // Total outstanding loan amount
  activeLoansCount: number;      // Number of active loans
  totalMissedPayments: number;   // Total missed payments
  hasDefaults: boolean;          // Loan default history flag
  activeFraudCases: number;      // Active fraud cases count
  
  // Data Availability
  dataFound: boolean;            // Whether external data was found
  
  // Next Steps
  nextSteps: string;
  readyForDecision: boolean;
  
  // Banking Recommendation
  recommendedAction: string;     // Recommended action based on scoring
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
