/**
 * Loan Application Models
 * All loan application-related interfaces and types
 */

/**
 * Loan application request (matches backend LoanApplicationRequest.java)
 */
export interface LoanApplicationRequest {
  loanType: string;  // LoanType enum
  loanAmount: number;  // Backend uses loanAmount, not requestedAmount
  tenureMonths: number;  // Backend uses tenureMonths
  purpose: string;
  additionalNotes?: string;
}

/**
 * Loan application create response (matches backend LoanApplicationCreateResponse.java)
 */
export interface LoanApplicationCreateResponse {
  id: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  status: string;
  message: string;
  createdAt: string;
  nextStep: string;
  nextStepUrl: string;
}

/**
 * Full loan application response
 */
export interface LoanApplicationResponse {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  status: string;
  riskLevel?: string;
  priority?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Officer assignment
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  
  // Application completion flags
  hasPersonalDetails?: boolean;
  hasFinancialProfile?: boolean;
  documentsCount?: number;
  employmentType?: string;
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  id: number;
  fileName: string;
  documentType: string;
  uploadedAt: Date;
  status: string;
}

/**
 * Document requirement
 */
export interface DocumentRequirement {
  documentType: string;
  documentTypeName: string;
  currentStatus: string; // VERIFIED, REJECTED, MISSING, PENDING
  canReupload: boolean;
  rejectionReason?: string;
  requiredAction: string;
  specificInstructions?: string;
  isRequired: boolean;
  lastUploadedAt?: string;
  fileName?: string;
  currentDocumentId?: number;
}

/**
 * Resubmission requirements response
 */
export interface ResubmissionRequirementsResponse {
  applicationId: string;
  applicationStatus: string;
  hasResubmissionRequirements: boolean;
  resubmissionDeadline?: string;
  additionalInstructions?: string;
  documentRequirements: DocumentRequirement[];
  requestedAt?: string;
  requestedByOfficer?: string;
  totalDocumentsRequired: number;
  documentsAlreadyVerified: number;
}

