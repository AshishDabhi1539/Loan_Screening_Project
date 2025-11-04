/**
 * Loan Officer Models
 * All loan officer-related interfaces and types
 */

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_RESUBMISSION';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Officer dashboard response
 */
export interface OfficerDashboardResponse {
  stats: OfficerStats;
  workload: WorkloadInfo;
  recentActivities: RecentActivity[];
  performanceMetrics: PerformanceMetrics;
}

/**
 * Officer statistics
 */
export interface OfficerStats {
  totalAssigned: number;
  pendingReview: number;
  underVerification: number;
  readyForDecision: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  averageProcessingTime: number;
}

/**
 * Workload information
 */
export interface WorkloadInfo {
  currentLoad: number;
  capacity: number;
  utilizationPercentage: number;
  priorityBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Recent activity entry
 */
export interface RecentActivity {
  id: string;
  applicationId: string;
  applicantName: string;
  action: string;
  timestamp: string;
  status: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  approvalRate: number;
  averageDecisionTime: number;
  qualityScore: number;
  productivityScore: number;
}

/**
 * Loan application summary for officer
 */
export interface LoanApplicationSummary {
  id: string;
  applicantName: string;
  loanType: string;
  requestedAmount: number;
  status: string;
  priority: Priority;
  assignedDate: string;
  lastUpdated: string;
  daysInQueue: number;
  riskLevel?: RiskLevel;
}

/**
 * Complete application details response
 */
export interface CompleteApplicationDetailsResponse {
  applicationInfo: ApplicationInfo;
  applicantIdentity: ApplicantIdentity;
  personalDetails: PersonalDetailsNested;
  employmentDetails: EmploymentDetails;
  financialAssessment: FinancialAssessment;
  documents: DocumentInfo[];
  externalVerification: ExternalVerificationInfo;
  verificationSummary: VerificationSummary;
  timeline: AuditEntry[];
}

/**
 * Application information
 */
export interface ApplicationInfo {
  id: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  status: string;
  priority: Priority;
  submittedAt: string;
  assignedAt: string;
  lastUpdated: string;
  assignedOfficerName: string;
}

/**
 * Applicant identity information
 */
export interface ApplicantIdentity {
  userId: string;
  email: string;
  phone: string;
  displayName: string;
  accountStatus: string;
  registeredAt: string;
}

/**
 * Personal details nested structure
 */
export interface PersonalDetailsNested {
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  panNumber: string;
  aadhaarNumber: string;
  address: AddressInfo;
  contact: ContactInfo;
  verificationStatus: VerificationStatus;
}

/**
 * Address information
 */
export interface AddressInfo {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  residenceType: string;
  yearsAtCurrentAddress: number;
}

/**
 * Contact information
 */
export interface ContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
}

/**
 * Employment details
 */
export interface EmploymentDetails {
  employmentType: string;
  employerName?: string;
  designation?: string;
  yearsInCurrentJob?: number;
  totalWorkExperience?: number;
  monthlyIncome: number;
  companyContact?: CompanyContact;
  bankDetails?: BankDetails;
  verificationStatus: EmploymentVerificationStatus;
}

/**
 * Company contact information
 */
export interface CompanyContact {
  companyName: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
}

/**
 * Bank details
 */
export interface BankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

/**
 * Employment verification status
 */
export interface EmploymentVerificationStatus {
  status: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

/**
 * Financial assessment
 */
export interface FinancialAssessment {
  loanDetails: LoanDetails;
  existingLoans: ExistingLoan[];
  calculatedRatios: CalculatedRatios;
  riskAssessment: RiskAssessment;
}

/**
 * Loan details
 */
export interface LoanDetails {
  requestedAmount: number;
  tenureMonths: number;
  estimatedEmi: number;
  estimatedInterestRate: number;
  totalInterest: number;
  totalRepayment: number;
}

/**
 * Existing loan information
 */
export interface ExistingLoan {
  loanType: string;
  lender: string;
  outstandingAmount: number;
  emi: number;
  remainingTenure: number;
}

/**
 * Calculated financial ratios
 */
export interface CalculatedRatios {
  foir: number;
  dti: number;
  loanToIncome: number;
  disposableIncome: number;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  overallRisk: RiskLevel;
  creditScore?: number;
  riskFactors: string[];
  mitigatingFactors: string[];
  recommendation: string;
}

/**
 * Document information
 */
export interface DocumentInfo {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  category: string;
}

/**
 * External verification information
 */
export interface ExternalVerificationInfo {
  creditBureauCheck?: CreditBureauCheck;
  fraudDetection?: FraudDetection;
  employmentVerification?: EmploymentVerificationExternal;
  addressVerification?: AddressVerification;
}

/**
 * Credit bureau check
 */
export interface CreditBureauCheck {
  status: string;
  creditScore?: number;
  reportDate?: string;
  bureau?: string;
  summary?: string;
}

/**
 * Fraud detection
 */
export interface FraudDetection {
  status: string;
  riskScore?: number;
  flags?: string[];
  checkedAt?: string;
}

/**
 * Employment verification external
 */
export interface EmploymentVerificationExternal {
  status: string;
  verifiedAt?: string;
  verificationMethod?: string;
  notes?: string;
}

/**
 * Address verification
 */
export interface AddressVerification {
  status: string;
  verifiedAt?: string;
  verificationMethod?: string;
  notes?: string;
}

/**
 * Verification summary
 */
export interface VerificationSummary {
  personalDetailsVerified: boolean;
  employmentVerified: boolean;
  documentsVerified: boolean;
  externalVerificationComplete: boolean;
  readyForDecision: boolean;
  pendingItems: string[];
}

/**
 * Audit entry for timeline
 */
export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  details?: string;
  oldStatus?: string;
  newStatus?: string;
}

/**
 * Document verification request
 */
export interface DocumentVerificationRequest {
  documentId: string;
  status: VerificationStatus;
  notes?: string;
  rejectionReason?: string;
}

/**
 * Document resubmission request
 */
export interface DocumentResubmissionRequest {
  documentTypes: string[];
  reason: string;
  deadline?: string;
  additionalNotes?: string;
}

/**
 * Document resubmission response
 */
export interface DocumentResubmissionResponse {
  applicationId: string;
  requestedDocuments: string[];
  requestedAt: string;
  deadline?: string;
  message: string;
}

/**
 * Loan decision request
 */
export interface LoanDecisionRequest {
  decision: 'APPROVE' | 'REJECT';
  approvedAmount?: number;
  approvedTenureMonths?: number;
  interestRate?: number;
  rejectionReason?: string;
  conditions?: string[];
  notes?: string;
}

/**
 * Loan decision response
 */
export interface LoanDecisionResponse {
  applicationId: string;
  decision: string;
  approvedAmount?: number;
  approvedTenureMonths?: number;
  interestRate?: number;
  emi?: number;
  totalInterest?: number;
  totalRepayment?: number;
  processedAt: string;
  processedBy: string;
  message: string;
}

/**
 * Compliance flag request
 */
export interface ComplianceFlagRequest {
  reason: string;
  priority: Priority;
  concernedDocuments?: string[];
  additionalNotes?: string;
}

/**
 * External verification response
 */
export interface ExternalVerificationResponse {
  applicationId: string;
  verificationType: string;
  status: string;
  creditScore?: number;
  riskScore?: number;
  verifiedAt: string;
  summary: string;
  details: any;
}

/**
 * Loan application response for officer view
 */
export interface LoanApplicationResponse {
  id: string;
  applicantName: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  status: string;
  priority: Priority;
  submittedAt: string;
  assignedAt?: string;
  lastUpdated: string;
  employmentType?: string;
  monthlyIncome?: number;
  riskLevel?: RiskLevel;
  verificationProgress?: number;
}
