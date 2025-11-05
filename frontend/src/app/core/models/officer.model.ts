/**
 * Loan Officer Models
 * All loan officer-related interfaces and types
 */

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_RESUBMISSION';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Officer dashboard response (actual API structure)
 */
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
  recentApplications: LoanApplicationSummaryOfficer[];
  recentActivities: RecentActivityOfficer[];
  
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

/**
 * Loan application summary for officer (actual API structure)
 */
export interface LoanApplicationSummaryOfficer {
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

/**
 * Recent activity for officer (actual API structure)
 */
export interface RecentActivityOfficer {
  id: string;
  action: string;
  applicantName: string;
  applicationId: string;
  timestamp: Date;
  status: string;
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
 * Complete application details response (for officer service)
 */
export interface CompleteApplicationDetailsResponse {
  applicationInfo: ApplicationInfo;
  applicantIdentity: ApplicantIdentity;
  employmentDetails: EmploymentDetails;
  documents: DocumentInfo[];
  financialAssessment: FinancialAssessment;
  verificationSummary: VerificationSummary;
  externalVerification: ExternalVerificationInfo | null;
}

/**
 * Application information (for officer service)
 */
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

/**
 * Applicant identity information (for officer service)
 */
export interface ApplicantIdentity {
  personalDetails: PersonalDetailsNested;
  contactInfo: ContactInfo;
  verificationStatus: VerificationStatusType;
}

/**
 * Verification status type (for officer service)
 */
export interface VerificationStatusType {
  identityVerified: boolean;
  addressVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  identityVerificationNotes?: string;
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
 * Address information (for officer service - nested structure)
 */
export interface AddressInfo {
  permanentAddress: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
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
 * Employment details (for officer service)
 */
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

/**
 * Company contact information (for officer service)
 */
export interface CompanyContact {
  companyPhone?: string;
  companyEmail?: string;
  hrPhone?: string;
  hrEmail?: string;
  managerName?: string;
  managerPhone?: string;
  companyAddress?: string;
}

/**
 * Bank details (for officer service)
 */
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
}

/**
 * Employment verification status (for officer service)
 */
export interface EmploymentVerificationStatus {
  employmentVerified: boolean;
  incomeVerified: boolean;
  bankAccountVerified: boolean;
  employmentVerificationNotes?: string;
  incomeVerificationNotes?: string;
  lastVerificationDate?: Date;
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
 * Loan details (for officer service)
 */
export interface LoanDetails {
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  estimatedEmi: number;
  estimatedInterestRate: number;
}

/**
 * Existing loan information (for officer service)
 */
export interface ExistingLoan {
  loanType: string;
  emiAmount: number;
  outstandingAmount: number;
  bankName: string;
  remainingTenure: number;
}

/**
 * Calculated financial ratios (for officer service)
 */
export interface CalculatedRatios {
  emiToIncomeRatio: number;
  debtToIncomeRatio: number;
  loanToIncomeRatio: number;
  affordabilityStatus: string;
  recommendation: string;
}

/**
 * Risk assessment (for officer service)
 */
export interface RiskAssessment {
  riskLevel: string;
  riskScore: number;
  fraudScore: number;
  riskFactors: string[];
  overallAssessment: string;
}

/**
 * Document information (for officer service)
 */
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

/**
 * External verification information (for officer service)
 */
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
 * Verification summary (for officer service)
 */
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

/**
 * Audit entry for timeline (for officer service)
 */
export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: string;
  status?: string;
}

/**
 * Document verification request (for officer service)
 */
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

/**
 * Document resubmission request (for officer service)
 */
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

/**
 * Document resubmission response (for officer service)
 */
export interface DocumentResubmissionResponse {
  message: string;
  applicationId: string;
  requiredDocuments: string[];
  dueDate?: string;
  status: string;
}

/**
 * Loan decision request (for officer service)
 */
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

/**
 * Loan decision response (for officer service)
 */
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

/**
 * Compliance flag request (for officer service)
 */
export interface ComplianceFlagRequest {
  flagReason: string;
  suspiciousActivities: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  additionalEvidence?: string;
}

/**
 * External verification response (for officer service)
 */
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

/**
 * Loan application response for officer view
 */
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

/**
 * Personal details (flat structure for form submission)
 */
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

/**
 * Financial details (flat structure for form submission)
 */
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
