import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminStats, SystemStats } from '../../../../core/models/admin.model';

interface ReportData {
  systemOverview: {
    totalUsers: number;
    totalOfficers: number;
    totalApplicants: number;
    totalApplications: number;
    activeUsers: number;
    systemHealth: string;
  };
  applicationStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    underReview: number;
    draft: number;
    approvalRate: number;
    rejectionRate: number;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
  };
  officerStats: {
    totalOfficers: number;
    activeOfficers: number;
    loanOfficers: number;
    complianceOfficers: number;
    averageApplicationsPerOfficer: number;
  };
  financialStats: {
    totalLoanAmount: number;
    totalApprovedAmount: number;
    totalDisbursedAmount: number;
    averageLoanAmount: number;
  };
  performanceMetrics: {
    averageProcessingTime: number;
    averageApprovalTime: number;
    averageRejectionTime: number;
    systemUptime: number;
  };
}

@Component({
  selector: 'app-system-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './system-report.component.html',
  styleUrl: './system-report.component.css'
})
export class SystemReportComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);

  isLoading = signal(true);
  isGenerating = signal(false);
  reportData = signal<ReportData | null>(null);
  
  // Date filters
  dateRange = signal<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  startDate = signal<string>('');
  endDate = signal<string>('');

  currentUser = this.authService.currentUser;
  generatedAt = signal<Date>(new Date());

  // Computed values
  systemHealthColor = computed(() => {
    const health = this.reportData()?.systemOverview.systemHealth || 'good';
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  });

  approvalRateColor = computed(() => {
    const rate = this.reportData()?.applicationStats.approvalRate || 0;
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  });

  ngOnInit(): void {
    this.initializeDateRange();
    this.loadReportData();
  }

  /**
   * Initialize date range to current month
   */
  private initializeDateRange(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate.set(firstDayOfMonth.toISOString().split('T')[0]);
    this.endDate.set(today.toISOString().split('T')[0]);
  }

  /**
   * Load system report data
   */
  loadReportData(): void {
    this.isLoading.set(true);
    this.generatedAt.set(new Date());

    this.adminService.getAdminDashboardData().subscribe({
      next: (data) => {
        const stats = data.stats;
        
        // Calculate comprehensive report data
        const totalUsers = stats.totalUsers || 0;
        const totalOfficers = stats.totalOfficers || 0;
        const totalApplications = stats.totalApplications || 0;
        const activeUsers = stats.activeUsers || 0;
        const pendingApplications = stats.pendingApplications || 0;
        const approvedApplications = stats.approvedApplications || 0;
        const rejectedApplications = stats.rejectedApplications || 0;
        
        // Convert systemHealth to string
        const systemHealthValue = stats.systemHealth;
        let systemHealthString: string;
        if (typeof systemHealthValue === 'string') {
          systemHealthString = systemHealthValue;
        } else if (typeof systemHealthValue === 'number') {
          systemHealthString = systemHealthValue.toString();
        } else {
          systemHealthString = 'good';
        }
        
        const report: ReportData = {
          systemOverview: {
            totalUsers: totalUsers,
            totalOfficers: totalOfficers,
            totalApplicants: totalUsers - totalOfficers,
            totalApplications: totalApplications,
            activeUsers: activeUsers,
            systemHealth: systemHealthString
          },
          applicationStats: {
            total: totalApplications,
            pending: pendingApplications,
            approved: approvedApplications,
            rejected: rejectedApplications,
            underReview: 0, // TODO: Get from backend
            draft: 0, // TODO: Get from backend
            approvalRate: totalApplications > 0 
              ? (approvedApplications / totalApplications) * 100 
              : 0,
            rejectionRate: totalApplications > 0 
              ? (rejectedApplications / totalApplications) * 100 
              : 0
          },
          userStats: {
            totalUsers: totalUsers,
            activeUsers: activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            newUsersThisMonth: 0, // TODO: Get from backend
            newUsersThisWeek: 0 // TODO: Get from backend
          },
          officerStats: {
            totalOfficers: totalOfficers,
            activeOfficers: totalOfficers, // TODO: Get actual active count
            loanOfficers: 0, // TODO: Get from backend
            complianceOfficers: 0, // TODO: Get from backend
            averageApplicationsPerOfficer: totalOfficers > 0 
              ? totalApplications / totalOfficers 
              : 0
          },
          financialStats: {
            totalLoanAmount: 0, // TODO: Get from backend
            totalApprovedAmount: 0, // TODO: Get from backend
            totalDisbursedAmount: 0, // TODO: Get from backend
            averageLoanAmount: 0 // TODO: Get from backend
          },
          performanceMetrics: {
            averageProcessingTime: 0, // TODO: Get from backend
            averageApprovalTime: 0, // TODO: Get from backend
            averageRejectionTime: 0, // TODO: Get from backend
            systemUptime: 99.9 // TODO: Calculate from backend
          }
        };

        this.reportData.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load report data:', error);
        this.notificationService.error('Error', 'Failed to load system report data');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refresh report data
   */
  refreshReport(): void {
    this.loadReportData();
    this.notificationService.success('Success', 'Report data refreshed');
  }

  /**
   * Export report as PDF (placeholder)
   */
  exportAsPdf(): void {
    this.isGenerating.set(true);
    // TODO: Implement PDF generation
    setTimeout(() => {
      this.notificationService.info('Info', 'PDF export feature coming soon');
      this.isGenerating.set(false);
    }, 1000);
  }

  /**
   * Export report as CSV (placeholder)
   */
  exportAsCsv(): void {
    this.isGenerating.set(true);
    // TODO: Implement CSV export
    setTimeout(() => {
      this.notificationService.info('Info', 'CSV export feature coming soon');
      this.isGenerating.set(false);
    }, 1000);
  }

  /**
   * Change date range filter
   */
  onDateRangeChange(range: 'today' | 'week' | 'month' | 'year' | 'all'): void {
    this.dateRange.set(range);
    const today = new Date();
    let start: Date;

    switch (range) {
      case 'today':
        start = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(2020, 0, 1); // All time
    }

    this.startDate.set(start.toISOString().split('T')[0]);
    if (range !== 'all') {
      this.endDate.set(today.toISOString().split('T')[0]);
    }
    
    // Reload data with new date range
    this.loadReportData();
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format time duration
   */
  formatDuration(hours: number): string {
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} days ${remainingHours.toFixed(1)} hours`;
  }
}

