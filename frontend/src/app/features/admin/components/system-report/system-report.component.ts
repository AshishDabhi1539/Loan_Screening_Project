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
   * Handle date range change
   */
  onDateRangeChange(range: 'today' | 'week' | 'month' | 'year' | 'all'): void {
    this.dateRange.set(range);
    this.updateDateRange(range);
    this.loadReportData();
  }

  /**
   * Update date range based on selection
   */
  private updateDateRange(range: 'today' | 'week' | 'month' | 'year' | 'all'): void {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (range) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1); // Start from 2020
        break;
    }

    this.startDate.set(startDate.toISOString().split('T')[0]);
    this.endDate.set(endDate.toISOString().split('T')[0]);
  }

  /**
   * Refresh report data
   */
  refreshReport(): void {
    this.loadReportData();
    this.notificationService.success('Success', 'Report data refreshed successfully');
  }

  /**
   * Export report as CSV
   */
  exportAsCsv(): void {
    this.isGenerating.set(true);
    
    try {
      const data = this.reportData();
      if (!data) {
        this.notificationService.error('Error', 'No data available to export');
        return;
      }

      const csvContent = this.generateCsvContent(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `system-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      this.notificationService.success('Success', 'CSV report exported successfully');
    } catch (error) {
      this.notificationService.error('Error', 'Failed to export CSV report');
    } finally {
      this.isGenerating.set(false);
    }
  }

  /**
   * Export report as PDF
   */
  exportAsPdf(): void {
    this.isGenerating.set(true);
    
    try {
      // For now, we'll create a simple PDF. In a real implementation, 
      // you would use libraries like jsPDF with chart support
      const data = this.reportData();
      if (!data) {
        this.notificationService.error('Error', 'No data available to export');
        return;
      }

      // Create a simple HTML content for PDF
      const htmlContent = this.generatePdfContent(data);
      
      // Open in new window for printing (simple PDF solution)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      this.notificationService.success('Success', 'PDF report generated successfully');
    } catch (error) {
      this.notificationService.error('Error', 'Failed to export PDF report');
    } finally {
      this.isGenerating.set(false);
    }
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
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours.toFixed(1)} hours`;
  }

  /**
   * Generate CSV content from report data
   */
  private generateCsvContent(data: ReportData): string {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push('System Report - Generated on ' + new Date().toLocaleDateString());
    csvRows.push('Date Range: ' + this.startDate() + ' to ' + this.endDate());
    csvRows.push('');
    
    // System Overview
    csvRows.push('SYSTEM OVERVIEW');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Users,${data.systemOverview.totalUsers}`);
    csvRows.push(`Total Officers,${data.systemOverview.totalOfficers}`);
    csvRows.push(`Total Applications,${data.systemOverview.totalApplications}`);
    csvRows.push(`Active Users,${data.systemOverview.activeUsers}`);
    csvRows.push(`System Health,${data.systemOverview.systemHealth}`);
    csvRows.push('');
    
    // Application Statistics
    csvRows.push('APPLICATION STATISTICS');
    csvRows.push('Status,Count,Percentage');
    const total = data.applicationStats.total;
    csvRows.push(`Total,${total},100%`);
    csvRows.push(`Pending,${data.applicationStats.pending},${total > 0 ? ((data.applicationStats.pending / total) * 100).toFixed(1) : 0}%`);
    csvRows.push(`Approved,${data.applicationStats.approved},${total > 0 ? ((data.applicationStats.approved / total) * 100).toFixed(1) : 0}%`);
    csvRows.push(`Rejected,${data.applicationStats.rejected},${total > 0 ? ((data.applicationStats.rejected / total) * 100).toFixed(1) : 0}%`);
    csvRows.push(`Approval Rate,${data.applicationStats.approvalRate.toFixed(1)}%,`);
    csvRows.push('');
    
    // User Statistics
    csvRows.push('USER STATISTICS');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Users,${data.userStats.totalUsers}`);
    csvRows.push(`Active Users,${data.userStats.activeUsers}`);
    csvRows.push(`Inactive Users,${data.userStats.inactiveUsers}`);
    csvRows.push(`New This Month,${data.userStats.newUsersThisMonth}`);
    csvRows.push(`New This Week,${data.userStats.newUsersThisWeek}`);
    csvRows.push('');
    
    // Officer Statistics
    csvRows.push('OFFICER STATISTICS');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Officers,${data.officerStats.totalOfficers}`);
    csvRows.push(`Active Officers,${data.officerStats.activeOfficers}`);
    csvRows.push(`Loan Officers,${data.officerStats.loanOfficers}`);
    csvRows.push(`Compliance Officers,${data.officerStats.complianceOfficers}`);
    csvRows.push(`Avg Applications per Officer,${data.officerStats.averageApplicationsPerOfficer.toFixed(1)}`);
    csvRows.push('');
    
    // Performance Metrics
    csvRows.push('PERFORMANCE METRICS');
    csvRows.push('Metric,Value');
    csvRows.push(`Average Processing Time,${this.formatDuration(data.performanceMetrics.averageProcessingTime)}`);
    csvRows.push(`Average Approval Time,${this.formatDuration(data.performanceMetrics.averageApprovalTime)}`);
    csvRows.push(`Average Rejection Time,${this.formatDuration(data.performanceMetrics.averageRejectionTime)}`);
    csvRows.push(`System Uptime,${this.formatPercentage(data.performanceMetrics.systemUptime)}`);
    
    return csvRows.join('\n');
  }

  /**
   * Generate PDF content from report data
   */
  private generatePdfContent(data: ReportData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>System Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .header h1 { color: #3b82f6; margin: 0; font-size: 28px; }
        .header p { margin: 5px 0; color: #666; }
        .section { margin: 30px 0; }
        .section h2 { color: #1f2937; border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 15px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .metric-card h3 { margin: 0 0 10px 0; color: #374151; font-size: 14px; }
        .metric-card .value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .metric-card .label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: 600; color: #374151; }
        .chart-placeholder { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 40px; text-align: center; color: #64748b; margin: 20px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>System Report</h1>
        <p>Comprehensive system analytics and performance metrics</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Date Range: ${this.startDate()} to ${this.endDate()}</p>
      </div>

      <div class="section">
        <h2>System Overview</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Total Users</h3>
            <div class="value">${this.formatNumber(data.systemOverview.totalUsers)}</div>
            <div class="label">${this.formatNumber(data.systemOverview.activeUsers)} active</div>
          </div>
          <div class="metric-card">
            <h3>Total Officers</h3>
            <div class="value">${this.formatNumber(data.systemOverview.totalOfficers)}</div>
            <div class="label">${this.formatNumber(data.officerStats.activeOfficers)} active</div>
          </div>
          <div class="metric-card">
            <h3>Total Applications</h3>
            <div class="value">${this.formatNumber(data.systemOverview.totalApplications)}</div>
            <div class="label">${this.formatNumber(data.applicationStats.pending)} pending</div>
          </div>
          <div class="metric-card">
            <h3>System Health</h3>
            <div class="value">${data.systemOverview.systemHealth}</div>
            <div class="label">Uptime: ${this.formatPercentage(data.performanceMetrics.systemUptime)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Application Statistics</h2>
        <div class="chart-placeholder">
          <h3>Application Status Distribution</h3>
          <p>📊 Approved: ${this.formatNumber(data.applicationStats.approved)} (${((data.applicationStats.approved / data.applicationStats.total) * 100).toFixed(1)}%)</p>
          <p>📊 Pending: ${this.formatNumber(data.applicationStats.pending)} (${((data.applicationStats.pending / data.applicationStats.total) * 100).toFixed(1)}%)</p>
          <p>📊 Rejected: ${this.formatNumber(data.applicationStats.rejected)} (${((data.applicationStats.rejected / data.applicationStats.total) * 100).toFixed(1)}%)</p>
        </div>
        <table>
          <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
          <tr><td>Total Applications</td><td>${this.formatNumber(data.applicationStats.total)}</td><td>100%</td></tr>
          <tr><td>Pending Review</td><td>${this.formatNumber(data.applicationStats.pending)}</td><td>${((data.applicationStats.pending / data.applicationStats.total) * 100).toFixed(1)}%</td></tr>
          <tr><td>Approved</td><td>${this.formatNumber(data.applicationStats.approved)}</td><td>${((data.applicationStats.approved / data.applicationStats.total) * 100).toFixed(1)}%</td></tr>
          <tr><td>Rejected</td><td>${this.formatNumber(data.applicationStats.rejected)}</td><td>${((data.applicationStats.rejected / data.applicationStats.total) * 100).toFixed(1)}%</td></tr>
          <tr><td><strong>Approval Rate</strong></td><td><strong>${this.formatPercentage(data.applicationStats.approvalRate)}</strong></td><td>-</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>Performance Metrics</h2>
        <div class="chart-placeholder">
          <h3>System Performance Overview</h3>
          <p>⚡ System Uptime: ${this.formatPercentage(data.performanceMetrics.systemUptime)}</p>
          <p>🔄 Processing Speed: ${this.formatDuration(data.performanceMetrics.averageProcessingTime)}</p>
          <p>✅ Approval Time: ${this.formatDuration(data.performanceMetrics.averageApprovalTime)}</p>
          <p>❌ Rejection Time: ${this.formatDuration(data.performanceMetrics.averageRejectionTime)}</p>
        </div>
      </div>

      <div class="section">
        <h2>Detailed Statistics</h2>
        <table>
          <tr><th>Category</th><th>Metric</th><th>Value</th></tr>
          <tr><td rowspan="5">Users</td><td>Total Users</td><td>${this.formatNumber(data.userStats.totalUsers)}</td></tr>
          <tr><td>Active Users</td><td>${this.formatNumber(data.userStats.activeUsers)}</td></tr>
          <tr><td>Inactive Users</td><td>${this.formatNumber(data.userStats.inactiveUsers)}</td></tr>
          <tr><td>New This Month</td><td>${this.formatNumber(data.userStats.newUsersThisMonth)}</td></tr>
          <tr><td>New This Week</td><td>${this.formatNumber(data.userStats.newUsersThisWeek)}</td></tr>
          <tr><td rowspan="5">Officers</td><td>Total Officers</td><td>${this.formatNumber(data.officerStats.totalOfficers)}</td></tr>
          <tr><td>Active Officers</td><td>${this.formatNumber(data.officerStats.activeOfficers)}</td></tr>
          <tr><td>Loan Officers</td><td>${this.formatNumber(data.officerStats.loanOfficers)}</td></tr>
          <tr><td>Compliance Officers</td><td>${this.formatNumber(data.officerStats.complianceOfficers)}</td></tr>
          <tr><td>Avg Applications/Officer</td><td>${data.officerStats.averageApplicationsPerOfficer.toFixed(1)}</td></tr>
        </table>
      </div>

      <div class="footer">
        <p> 2024 Loanify. All rights reserved. | System Reports Dashboard | Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
    `;
  }
}
