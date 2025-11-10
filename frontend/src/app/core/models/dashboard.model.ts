/**
 * Dashboard Models
 * All dashboard-related interfaces and types
 */

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingAmount: number;
  approvedAmount: number;
}

/**
 * Loan application summary for dashboard
 */
export interface LoanApplicationSummary {
  id: string;
  loanType: string;
  requestedAmount: number;
  status: string;
  submittedDate: Date;
  lastUpdated: Date;
  nextAction?: string;
  progress: number;
  applicantName?: string;
  assignedOfficerName?: string;
  // Progress tracking
  hasPersonalDetails?: boolean;
  hasFinancialProfile?: boolean;
  documentsCount?: number;
  employmentType?: string;
  // Approved loan fields (for active loans)
  approvedAmount?: number;
  approvedInterestRate?: number;
  approvedTenureMonths?: number;
}

/**
 * Complete dashboard data
 */
export interface DashboardData {
  stats: DashboardStats;
  recentApplications: LoanApplicationSummary[];
  pendingActions: LoanApplicationSummary[];
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Time series data
 */
export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

/**
 * Application status breakdown
 */
export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
  amount: number;
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
  month: string;
  applicationsReceived: number;
  applicationsApproved: number;
  applicationsRejected: number;
  totalAmountDisbursed: number;
  averageProcessingTime: number;
}
