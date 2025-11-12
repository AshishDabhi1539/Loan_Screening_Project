/**
 * Admin Models
 * All admin-related interfaces and types
 */

/**
 * Admin statistics
 */
export interface AdminStats {
  totalOfficers?: number;
  activeOfficers?: number;
  totalApplicants?: number;
  complianceOfficers?: number;
  activeApplications?: number;
  totalDisbursed?: number;
  systemHealth: 'good' | 'warning' | 'critical' | number;
  // Service-specific fields
  totalUsers?: number;
  totalApplications?: number;
  pendingApplications?: number;
  approvedApplications?: number;
  rejectedApplications?: number;
  activeUsers?: number;
}

/**
 * Officer response
 */
export interface OfficerResponse {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  lastLoginAt?: string;
  applicationsHandled?: number;
}

/**
 * User response
 */
export interface UserResponse {
  id: string;
  email: string;
  phone?: string;
  displayName?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  lastLoginAt?: string;
  hasPersonalDetails?: boolean;
  applicationCount?: number;
  // Service-specific fields
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
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
  createdAt: string;
  lastLogin?: string;
  lastLoginAt?: string;
  personalDetails?: OfficerPersonalDetails;
  stats?: OfficerStats;
  recentApplications?: OfficerApplicationSummary[];
  // Service-specific flat structure fields
  phone?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  failedLoginAttempts?: number;
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
export interface OfficerPersonalDetails {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  aadhaarNumber: string;
  phone: string;
  address: OfficerAddress;
}

/**
 * Officer address
 */
export interface OfficerAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/**
 * Officer statistics
 */
export interface OfficerStats {
  totalApplicationsHandled: number;
  applicationsApproved: number;
  applicationsRejected: number;
  averageProcessingTime: number;
  currentWorkload: number;
}

/**
 * Officer application summary
 */
export interface OfficerApplicationSummary {
  id: string;
  applicantName: string;
  loanType: string;
  requestedAmount: number;
  status: string;
  assignedAt: string;
  lastUpdated: string;
}

/**
 * Officer creation request
 */
export interface OfficerCreationRequest {
  email: string;
  password: string;
  role: 'LOAN_OFFICER' | 'SENIOR_LOAN_OFFICER' | 'COMPLIANCE_OFFICER' | 'SENIOR_COMPLIANCE_OFFICER';
  firstName: string;
  lastName: string;
  phone: string;
  designation?: string;
  department?: string;
  // Service-specific fields
  middleName?: string;
  phoneNumber?: string;
  workLocation?: string;
}

/**
 * System statistics
 */
export interface SystemStats {
  totalUsers: number;
  totalOfficers: number;
  totalApplications: number;
  activeApplications?: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalAmountDisbursed?: number;
  averageProcessingTime?: number;
  systemHealth?: number;
  pendingApplications: number;
}

/**
 * Recent activity
 */
export interface RecentActivity {
  id: string | number;
  action: string;
  type: string;
  description: string;
  timestamp: string | Date;
  entityType?: string;
  userName?: string;
  userType?: string; // Applicant, Loan Officer, etc.
}

/**
 * Dashboard Analytics - Complete analytics data structure
 */
export interface DashboardAnalytics {
  keyMetrics: KeyMetrics;
  chartData: ChartData;
  performanceData: PerformanceData;
  financialData: FinancialData;
  riskData: RiskData;
}

/**
 * Key Metrics for dashboard cards
 */
export interface KeyMetrics {
  newApplicationsThisMonth: number;
  newApplicationsGrowth: number;
  activeOfficers: number;
  activeOfficersGrowth: number;
  pendingReviews: number;
  pendingReviewsChange: number;
  approvalRateThisMonth: number;
  approvalRateChange: number;
}

/**
 * Chart Data for visualizations
 */
export interface ChartData {
  applicationStatusDistribution: { [key: string]: number };
  monthlyApplicationTrends: MonthlyTrend[];
  dailyUserActivity: DailyActivity[];
  officerPerformance: OfficerPerformance[];
}

/**
 * Performance metrics
 */
export interface PerformanceData {
  averageProcessingTimeDays: number;
  averageApprovalTimeDays: number;
  systemUptimePercentage: number;
  totalActiveUsers: number;
  totalSystemTransactions: number;
}

/**
 * Financial analytics
 */
export interface FinancialData {
  totalLoanAmountRequested: number;
  totalLoanAmountApproved: number;
  totalLoanAmountDisbursed: number;
  averageLoanAmount: number;
  disbursementRate: number;
}

/**
 * Risk analytics
 */
export interface RiskData {
  highRiskApplications: number;
  mediumRiskApplications: number;
  lowRiskApplications: number;
  fraudDetectionRate: number;
  totalFraudCases: number;
}

/**
 * Monthly trend data for charts
 */
export interface MonthlyTrend {
  month: string; // "2024-01"
  applications: number;
  approvals: number;
  rejections: number;
  totalAmount: number;
}

/**
 * Daily activity data for charts
 */
export interface DailyActivity {
  date: string; // "2024-01-15"
  userLogins: number;
  applicationSubmissions: number;
  officerActions: number;
}

/**
 * Officer performance data
 */
export interface OfficerPerformance {
  officerName: string;
  officerId: string;
  applicationsProcessed: number;
  applicationsApproved: number;
  approvalRate: number;
  averageProcessingTime: number;
}

/**
 * Officer status toggle response
 */
export interface OfficerStatusToggleResponse {
  officerId: string;
  newStatus: string;
  message: string;
  timestamp: string;
}

/**
 * Applicant details response
 */
export interface ApplicantDetailsResponse {
  id: string;
  email: string;
  phone?: string;
  displayName?: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  hasPersonalDetails: boolean;
  personalDetails?: ApplicantPersonalDetails;
  applications: ApplicantApplicationSummary[];
}

/**
 * Applicant personal details
 */
export interface ApplicantPersonalDetails {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  panNumber: string;
  aadhaarNumber: string;
  address: ApplicantAddress;
}

/**
 * Applicant address
 */
export interface ApplicantAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  residenceType: string;
}

/**
 * Applicant application summary
 */
export interface ApplicantApplicationSummary {
  id: string;
  loanType: string;
  requestedAmount: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
  lastUpdated: string;
  assignedOfficerName?: string;
}
