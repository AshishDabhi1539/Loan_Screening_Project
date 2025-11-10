/**
 * Compliance Officer Models
 * All compliance-related interfaces and types
 */

export type ComplianceStatus = 
  | 'FLAGGED_FOR_COMPLIANCE' 
  | 'COMPLIANCE_REVIEW' 
  | 'PENDING_COMPLIANCE_DOCUMENTS' 
  | 'CLEARED' 
  | 'REJECTED' 
  | 'ESCALATED';

export type InvestigationStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'AWAITING_DOCUMENTS' 
  | 'COMPLETED';

export type ComplianceDecision = 'CLEAR' | 'REJECT' | 'ESCALATE';

/**
 * Compliance dashboard response
 */
export interface ComplianceDashboardResponse {
  // Model structure (nested)
  stats?: ComplianceStats;
  workload?: ComplianceWorkload;
  recentActivities?: RecentComplianceActivity[];
  performanceMetrics?: CompliancePerformanceMetrics;
  // Service structure (flat)
  officerId?: string;
  officerName?: string;
  officerEmail?: string;
  role?: string;
  totalAssignedApplications?: number;
  flaggedForCompliance?: number;
  underComplianceReview?: number;
  pendingComplianceDocs?: number;
  completedToday?: number;
  completedThisWeek?: number;
  completedThisMonth?: number;
  criticalPriorityApplications?: number;
  highPriorityApplications?: number;
  mediumPriorityApplications?: number;
  lowPriorityApplications?: number;
  averageResolutionTimeHours?: number;
  totalCasesResolved?: number;
  complianceViolationsFound?: number;
  applicationsClearedToday?: number;
  totalSystemFlaggedApplications?: number;
  availableComplianceOfficers?: number;
  hasCapacityForNewCases?: boolean;
  lastUpdated?: string;
  dashboardVersion?: string;
}

/**
 * Compliance statistics
 */
export interface ComplianceStats {
  totalAssigned: number;
  underInvestigation: number;
  pendingDocuments: number;
  awaitingDecision: number;
  clearedThisMonth: number;
  rejectedThisMonth: number;
  escalatedThisMonth: number;
  averageInvestigationTime: number;
}

/**
 * Compliance workload
 */
export interface ComplianceWorkload {
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
 * Recent compliance activity
 */
export interface RecentComplianceActivity {
  id?: string;
  applicationId: string;
  applicantName: string;
  action: string;
  timestamp: string;
  status: string;
  priority: string;
  // Service-specific fields
  flagReason?: string;
  description?: string;
}

/**
 * Compliance performance metrics
 */
export interface CompliancePerformanceMetrics {
  clearanceRate: number;
  averageInvestigationTime: number;
  escalationRate: number;
  accuracyScore: number;
}

/**
 * Loan application response for compliance view
 */
export interface LoanApplicationResponse {
  id: string;
  applicantName: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths?: number;
  purpose?: string;
  status: ComplianceStatus | string;
  priority: string;
  flaggedAt?: string;
  flaggedBy?: string;
  flagReason?: string;
  assignedAt?: string;
  lastUpdated: string;
  investigationStatus?: InvestigationStatus;
  daysInCompliance?: number;
  // Service-specific fields
  applicationNumber?: string;
  applicantId?: string;
  applicantEmail?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt?: string;
  submittedAt?: string;
  complianceNotes?: string;
}

/**
 * Compliance decision request
 */
export interface ComplianceDecisionRequest {
  decision?: ComplianceDecision;
  findings?: string;
  rejectionReason?: string;
  escalationReason?: string;
  escalationLevel?: 'SENIOR_COMPLIANCE' | 'MANAGEMENT' | 'LEGAL';
  recommendations?: string[];
  attachments?: string[];
  // Service-specific fields
  decisionType?: 'CLEARED' | 'REJECTED' | 'ESCALATE' | 'REQUEST_DOCUMENTS';
  decisionNotes?: string;
  additionalNotes?: string;
  complianceViolationType?: string;
  recommendedAction?: string;
  requiresRegulatoryReporting?: boolean;
}

/**
 * Compliance decision response
 */
export interface ComplianceDecisionResponse {
  applicationId: string;
  decision: ComplianceDecision | string;
  status: string;
  processedAt: string;
  processedBy: string;
  message: string;
  nextSteps?: string[];
  // Service-specific fields
  newStatus?: string;
  decisionNotes?: string;
}

/**
 * Officer details response
 */
export interface OfficerDetailsResponse {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
  personalDetails?: OfficerPersonalDetailsResponse;
  profile?: OfficerProfileResponse;
  stats?: OfficerStatsResponse;
  // Service-specific flat structure fields
  phone?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  failedLoginAttempts?: number;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  phoneNumber?: string;
  workLocation?: string;
  totalAssignedApplications?: number;
  activeApplications?: number;
  completedApplications?: number;
}

/**
 * Officer personal details
 */
export interface OfficerPersonalDetailsResponse {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  address?: OfficerAddressResponse;
  // Service-specific fields
  fullName?: string;
  profilePhotoUrl?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/**
 * Officer address
 */
export interface OfficerAddressResponse {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/**
 * Officer profile
 */
export interface OfficerProfileResponse {
  designation?: string;
  department?: string;
  joiningDate?: string;
  employeeId?: string;
  reportingManager?: string;
  specializations?: string[];
  // Service-specific structure
  details?: OfficerDetailsResponse;
  personal?: OfficerPersonalDetailsResponse;
}

/**
 * Officer statistics
 */
export interface OfficerStatsResponse {
  totalApplicationsHandled: number;
  applicationsApproved: number;
  applicationsRejected: number;
  averageProcessingTime: number;
  performanceRating?: number;
}

/**
 * Compliance investigation response
 */
export interface ComplianceInvestigationResponse {
  applicationId?: string;
  investigationId: string;
  status?: InvestigationStatus;
  startedAt?: string;
  investigatedBy?: string;
  findings?: string;
  documentsReviewed?: number;
  flagsIdentified?: string[];
  riskAssessment?: string;
  recommendations?: string[];
  // Service-specific fields
  investigationDate?: string;
  applicantProfile?: any;
  overallAssessment?: any;
  bank_details?: any;
  fraud_records?: any;
  loan_history?: any;
  consolidatedFindings?: any;
}

/**
 * Compliance document request
 */
export interface ComplianceDocumentRequest {
  documentTypes?: string[];
  reason?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  specificInstructions?: string;
  // Service-specific fields
  requiredDocumentTypes?: string[];
  requestReason?: string; // Alias for reason (service uses this)
  additionalInstructions?: string;
  deadlineDays?: number;
  priorityLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  isMandatory?: boolean;
  complianceCategory?: string;
}

/**
 * Document verification details
 */
export interface DocumentVerificationDetails {
  documentId: string;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  verificationStatus: string;
  verifiedAt?: string;
  verifiedBy?: string;
  complianceNotes?: string;
  issuesFound?: string[];
}

/**
 * Investigation findings
 */
export interface InvestigationFindings {
  applicationId: string;
  investigationId: string;
  summary: string;
  detailedFindings: string;
  riskLevel: string;
  fraudIndicators: string[];
  documentIssues: string[];
  verificationIssues: string[];
  recommendations: string[];
  supportingEvidence: string[];
}

/**
 * Escalation request
 */
export interface EscalationRequest {
  reason: string;
  escalationLevel: 'SENIOR_COMPLIANCE' | 'MANAGEMENT' | 'LEGAL';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  detailedReport: string;
  attachments?: string[];
  recommendedAction?: string;
}

/**
 * Document request details
 */
export interface DocumentRequestDetails {
  requestId: string;
  applicationId: string;
  requestedDocuments: string[];
  requestedAt: string;
  requestedBy: string;
  reason: string;
  deadline?: string;
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE';
  receivedDocuments?: string[];
}

/**
 * Quick decision request
 */
export interface QuickDecisionRequest {
  decision: 'CLEAR' | 'REJECT';
  reason: string;
  notes?: string;
}

/**
 * Legacy compliance document request (deprecated)
 */
export interface LegacyComplianceDocumentRequest {
  documentTypes: string[];
  requestReason: string;
  deadline?: string;
  additionalNotes?: string;
}
