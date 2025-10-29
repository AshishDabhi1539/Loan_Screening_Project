import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingAmount: number;
  approvedAmount: number;
}

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
}

export interface DashboardData {
  stats: DashboardStats;
  recentApplications: LoanApplicationSummary[];
  pendingActions: LoanApplicationSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiService = inject(ApiService);

  /**
   * Get complete dashboard data for current user
   */
  getDashboardData(): Observable<DashboardData> {
    console.log('🔄 Fetching dashboard data from:', '/loan-application/my-applications');
    return this.apiService.get<any[]>('/loan-application/my-applications').pipe(
      map(applications => {
        console.log('✅ Dashboard API response:', applications);
        return this.transformDashboardResponse(applications);
      }),
      catchError(error => {
        console.error('❌ Dashboard API error:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        return of(this.getEmptyDashboardData());
      })
    );
  }

  /**
   * Get dashboard statistics only
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.apiService.get<any>('/loan-application/my-applications').pipe(
      map(applications => this.calculateStats(applications)),
      catchError(error => {
        console.error('Stats API error:', error);
        return of(this.getEmptyStats());
      })
    );
  }

  /**
   * Get recent applications for current user
   */
  getRecentApplications(limit: number = 5): Observable<LoanApplicationSummary[]> {
    return this.apiService.get<any[]>('/loan-application/my-applications').pipe(
      map(applications => this.transformApplications(applications).slice(0, limit)),
      catchError(error => {
        console.error('Recent applications API error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get applications requiring user action
   */
  getPendingActions(): Observable<LoanApplicationSummary[]> {
    return this.apiService.get<any[]>('/loan-application/my-applications').pipe(
      map(applications => 
        this.transformApplications(applications).filter(app => 
          this.needsUserAction(app.status)
        )
      ),
      catchError(error => {
        console.error('Pending actions API error:', error);
        return of([]);
      })
    );
  }

  /**
   * Transform backend response to dashboard format
   */
  private transformDashboardResponse(applications: any[]): DashboardData {
    return {
      stats: this.calculateStats(applications),
      recentApplications: this.transformApplications(applications).slice(0, 5),
      pendingActions: this.transformApplications(applications).filter(app => 
        this.needsUserAction(app.status)
      )
    };
  }

  /**
   * Transform backend application data to frontend format
   */
  private transformApplications(applications: any[]): LoanApplicationSummary[] {
    return applications.map(app => ({
      id: app.id,
      loanType: app.loanType,
      requestedAmount: Number(app.requestedAmount) || 0,
      status: app.status,
      submittedDate: new Date(app.submittedAt || app.createdAt || Date.now()),
      lastUpdated: new Date(app.updatedAt || Date.now()),
      nextAction: this.getNextAction(app.status),
      progress: this.calculateProgress(app.status),
      applicantName: app.applicantName,
      assignedOfficerName: app.assignedOfficerName
    }));
  }

  /**
   * Calculate dashboard statistics from applications
   */
  private calculateStats(applications: any[]): DashboardStats {
    const stats = {
      totalApplications: applications.length,
      activeApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      pendingAmount: 0,
      approvedAmount: 0
    };

    applications.forEach(app => {
      const amount = Number(app.requestedAmount) || 0;
      const status = app.status;

      switch (status) {
        case 'APPROVED':
        case 'DISBURSED':
          stats.approvedApplications++;
          stats.approvedAmount += amount;
          break;
        case 'REJECTED':
          stats.rejectedApplications++;
          break;
        case 'SUBMITTED':
        case 'UNDER_REVIEW':
        case 'PENDING_DOCUMENTS':
        case 'FLAGGED_FOR_COMPLIANCE':
        case 'COMPLIANCE_REVIEW':
        case 'READY_FOR_DECISION':
          stats.activeApplications++;
          stats.pendingAmount += amount;
          break;
        default:
          // DRAFT applications
          stats.pendingAmount += amount;
      }
    });

    return stats;
  }

  /**
   * Calculate application progress percentage
   */
  private calculateProgress(status: string): number {
    switch (status) {
      case 'DRAFT':
        return 10;
      case 'SUBMITTED':
        return 25;
      case 'UNDER_REVIEW':
        return 50;
      case 'PENDING_DOCUMENTS':
        return 40;
      case 'FLAGGED_FOR_COMPLIANCE':
      case 'COMPLIANCE_REVIEW':
        return 60;
      case 'READY_FOR_DECISION':
        return 80;
      case 'APPROVED':
      case 'DISBURSED':
        return 100;
      case 'REJECTED':
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Get next action text based on status
   */
  private getNextAction(status: string): string | undefined {
    switch (status) {
      case 'DRAFT':
        return 'Complete and submit application';
      case 'SUBMITTED':
        return 'Waiting for officer review';
      case 'UNDER_REVIEW':
        return 'Application being reviewed';
      case 'PENDING_DOCUMENTS':
        return 'Upload required documents';
      case 'FLAGGED_FOR_COMPLIANCE':
        return 'Under compliance review';
      case 'COMPLIANCE_REVIEW':
        return 'Compliance investigation in progress';
      case 'READY_FOR_DECISION':
        return 'Awaiting final decision';
      case 'APPROVED':
        return 'Complete loan documentation';
      case 'DISBURSED':
        return 'Loan disbursed successfully';
      case 'REJECTED':
        return 'Application rejected';
      default:
        return undefined;
    }
  }

  /**
   * Check if application needs user action
   */
  private needsUserAction(status: string): boolean {
    return ['DRAFT', 'PENDING_DOCUMENTS', 'APPROVED'].includes(status);
  }

  /**
   * Get empty dashboard data for error states
   */
  private getEmptyDashboardData(): DashboardData {
    return {
      stats: this.getEmptyStats(),
      recentApplications: [],
      pendingActions: []
    };
  }

  /**
   * Get empty stats for error states
   */
  private getEmptyStats(): DashboardStats {
    return {
      totalApplications: 0,
      activeApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      pendingAmount: 0,
      approvedAmount: 0
    };
  }

  /**
   * Get loan type display text
   */
  getLoanTypeDisplay(loanType: string): string {
    switch (loanType) {
      case 'HOME_LOAN':
        return 'Home Loan';
      case 'PERSONAL_LOAN':
        return 'Personal Loan';
      case 'CAR_LOAN':
        return 'Car Loan';
      case 'BUSINESS_LOAN':
        return 'Business Loan';
      case 'EDUCATION_LOAN':
        return 'Education Loan';
      default:
        return loanType?.replace(/_/g, ' ') || 'Loan';
    }
  }

  /**
   * Get status display text
   */
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'PENDING_DOCUMENTS':
        return 'Documents Pending';
      case 'FLAGGED_FOR_COMPLIANCE':
        return 'Compliance Review';
      case 'COMPLIANCE_REVIEW':
        return 'Under Investigation';
      case 'READY_FOR_DECISION':
        return 'Decision Pending';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'DISBURSED':
        return 'Disbursed';
      default:
        return status?.replace(/_/g, ' ') || 'Unknown';
    }
  }

  /**
   * Get status badge color classes
   */
  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_DOCUMENTS':
        return 'bg-orange-100 text-orange-800';
      case 'FLAGGED_FOR_COMPLIANCE':
      case 'COMPLIANCE_REVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'READY_FOR_DECISION':
        return 'bg-indigo-100 text-indigo-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DISBURSED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}
