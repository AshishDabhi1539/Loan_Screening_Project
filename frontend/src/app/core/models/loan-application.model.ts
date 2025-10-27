export interface LoanApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  loanType: LoanType;
  requestedAmount: number;
  purpose: string;
  status: ApplicationStatus;
  priority: Priority;
  riskLevel: RiskLevel;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedComplianceOfficerId?: string;
  assignedComplianceOfficerName?: string;
  submittedAt: Date;
  lastUpdatedAt: Date;
  documentsCount: number;
  fraudCheckResultsCount: number;
  externalVerificationStatus: VerificationStatus;
  complianceNotes?: string;
  officerNotes?: string;
  rejectionReason?: string;
  approvedAmount?: number;
  interestRate?: number;
  tenure?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanApplicationRequest {
  loanType: LoanType;
  requestedAmount: number;
  purpose: string;
  personalDetails: PersonalDetailsRequest;
  financialProfile: FinancialProfileRequest;
  employmentDetails: EmploymentDetailsRequest;
}

export interface LoanApplicationResponse {
  id: string;
  applicantId: string;
  applicantName: string;
  loanType: LoanType;
  requestedAmount: number;
  purpose: string;
  status: ApplicationStatus;
  priority: Priority;
  riskLevel: RiskLevel;
  submittedAt: string;
  lastUpdatedAt: string;
  documentsCount: number;
  fraudCheckResultsCount: number;
  externalVerificationStatus: VerificationStatus;
  message: string;
  timestamp: string;
}

export interface PersonalDetailsRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  panNumber: string;
  aadhaarNumber: string;
  address: AddressRequest;
}

export interface AddressRequest {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface FinancialProfileRequest {
  monthlyIncome: number;
  incomeType: IncomeType;
  employmentType: EmploymentType;
  existingLoans: number;
  creditScore?: number;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
}

export interface EmploymentDetailsRequest {
  companyName: string;
  designation: string;
  workExperience: number;
  companyAddress: AddressRequest;
  hrContactNumber?: string;
  salary: number;
}

export enum LoanType {
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  HOME_LOAN = 'HOME_LOAN',
  CAR_LOAN = 'CAR_LOAN',
  EDUCATION_LOAN = 'EDUCATION_LOAN',
  BUSINESS_LOAN = 'BUSINESS_LOAN',
  GOLD_LOAN = 'GOLD_LOAN',
  CREDIT_CARD = 'CREDIT_CARD'
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',
  DOCUMENTS_UPLOADED = 'DOCUMENTS_UPLOADED',
  DOCUMENTS_VERIFIED = 'DOCUMENTS_VERIFIED',
  EXTERNAL_VERIFICATION_PENDING = 'EXTERNAL_VERIFICATION_PENDING',
  EXTERNAL_VERIFICATION_COMPLETED = 'EXTERNAL_VERIFICATION_COMPLETED',
  READY_FOR_DECISION = 'READY_FOR_DECISION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED_FOR_COMPLIANCE = 'FLAGGED_FOR_COMPLIANCE',
  COMPLIANCE_REVIEW = 'COMPLIANCE_REVIEW',
  PENDING_COMPLIANCE_DOCS = 'PENDING_COMPLIANCE_DOCS',
  COMPLIANCE_APPROVED = 'COMPLIANCE_APPROVED',
  COMPLIANCE_REJECTED = 'COMPLIANCE_REJECTED',
  MANAGER_APPROVAL = 'MANAGER_APPROVAL',
  PRE_APPROVED = 'PRE_APPROVED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NOT_REQUIRED = 'NOT_REQUIRED'
}

export enum IncomeType {
  SALARIED = 'SALARIED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  BUSINESS = 'BUSINESS',
  FREELANCER = 'FREELANCER',
  PENSION = 'PENSION',
  OTHER = 'OTHER'
}

export enum EmploymentType {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
  RETIRED = 'RETIRED',
  STUDENT = 'STUDENT'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED'
}

// Dashboard Models
export interface ApplicantDashboard {
  totalApplications: number;
  activeApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  recentApplications: LoanApplication[];
  pendingDocuments: number;
  notifications: Notification[];
}

export interface OfficerDashboard {
  totalAssignedApplications: number;
  pendingReview: number;
  completedToday: number;
  flaggedApplications: number;
  recentActivities: RecentActivity[];
  workloadSummary: WorkloadSummary;
}

export interface ComplianceDashboard {
  totalFlaggedApplications: number;
  pendingInvestigation: number;
  completedInvestigations: number;
  highPriorityApplications: number;
  criticalPriorityApplications: number;
  recentActivities: RecentActivity[];
  officerName: string;
}

export interface RecentActivity {
  id: string;
  applicationId: string;
  applicantName: string;
  action: string;
  timestamp: Date;
  status: ApplicationStatus;
}

export interface WorkloadSummary {
  assignedApplications: number;
  completedThisWeek: number;
  averageProcessingTime: number;
  performanceRating: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export enum NotificationType {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}
