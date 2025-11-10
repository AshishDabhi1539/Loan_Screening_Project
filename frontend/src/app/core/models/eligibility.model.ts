/**
 * Loan Eligibility Models
 * All eligibility and FOIR calculation-related interfaces
 */

export type FOIRStatus = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'HIGH_RISK';

/**
 * Employment type eligibility
 */
export interface EmploymentTypeEligibility {
  employmentType: string;
  eligible: boolean;
  reason: string;
  minimumDurationMonths?: number;
}

/**
 * Loan eligibility response
 */
export interface LoanEligibilityResponse {
  loanType: string;
  employmentTypes: EmploymentTypeEligibility[];
  minimumIncome: number;
  maxFOIR: number;
  additionalCriteria: any;
}

/**
 * FOIR calculation response
 */
export interface FOIRCalculationResponse {
  monthlyIncome: number;
  existingObligations: number;
  newEmi: number;
  totalObligations: number;
  disposableIncome: number;
  foirPercentage: number;
  acceptable: boolean;
  status: FOIRStatus;
  message: string;
}

/**
 * Eligibility criteria
 */
export interface EligibilityCriteria {
  loanType: string;
  minimumIncome: number;
  maximumAge: number;
  minimumAge: number;
  maxFOIR: number;
  minCreditScore?: number;
  employmentTypes: string[];
  minimumEmploymentDuration?: number;
  additionalRequirements?: string[];
}

/**
 * Eligibility check result
 */
export interface EligibilityCheckResult {
  eligible: boolean;
  reasons: string[];
  missingCriteria: string[];
  recommendations: string[];
  estimatedApprovalChance?: number;
}
