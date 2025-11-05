import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ComplianceService } from '../../../../core/services/compliance.service';
import { ComplianceDashboardResponse, LoanApplicationResponse } from '../../../../core/models/compliance.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { IdEncoderService } from '../../../../core/services/id-encoder.service';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compliance-dashboard.component.html',
  styleUrl: './compliance-dashboard.component.css'
})
export class ComplianceDashboardComponent implements OnInit {
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private idEncoder = inject(IdEncoderService);

  // State signals
  dashboard = signal<ComplianceDashboardResponse | null>(null);
  assignedApplications = signal<LoanApplicationResponse[]>([]);
  completedApplications = signal<LoanApplicationResponse[]>([]);
  isLoading = signal(true);

  // Computed properties for cards
  userDisplayName = computed(() => {
    const raw = this.dashboard()?.officerName || '';
    if (raw.trim().length > 0) {
      // Extract first and last name only
      const parts = raw.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0];
      if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return 'Compliance Officer';
  });

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  // Computed properties for cards
  totalAssigned = computed(() => this.dashboard()?.totalAssignedApplications || 0);
  
  inProgress = computed(() => {
    const apps = this.assignedApplications();
    return apps.filter(app => 
      app.status === 'FLAGGED_FOR_COMPLIANCE' || 
      app.status === 'COMPLIANCE_REVIEW' || 
      app.status === 'PENDING_COMPLIANCE_DOCS'
    ).length;
  });

  /**
   * Approved by Compliance: count of applications for which this officer submitted APPROVE
   * We consider applications currently in READY_FOR_DECISION status and with complianceNotes containing "Compliance Decision: APPROVE".
   */
  approvedByComplianceCount = computed(() => {
    const apps = this.completedApplications();
    return apps.filter(app => {
      const notes = app.complianceNotes || '';
      return /Compliance Decision:\s*APPROVE/i.test(notes);
    }).length;
  });

  rejected = computed(() => {
    const apps = this.assignedApplications();
    return apps.filter(app => app.status === 'REJECTED').length;
  });

  // Top 5 assigned applications
  topApplications = computed(() => {
    return this.assignedApplications().slice(0, 5);
  });

  // Pie chart data for performance metrics
  performanceChartData = computed(() => {
    const data = this.dashboard();
    console.log('📊 Performance Metrics Data:', {
      dashboard: data,
      totalCasesResolved: data?.totalCasesResolved,
      applicationsClearedToday: data?.applicationsClearedToday,
      complianceViolationsFound: data?.complianceViolationsFound
    });
    
    if (!data) {
      console.log('⚠️ No dashboard data available');
      return [];
    }
    
    const total = data.totalCasesResolved || 0;
    if (total === 0) {
      console.log('⚠️ No cases resolved yet (totalCasesResolved = 0)');
      return [];
    }
    
    const cleared = data.applicationsClearedToday || 0;
    const violations = data.complianceViolationsFound || 0;
    const others = Math.max(0, total - cleared - violations);
    
    const chartData = [
      { label: 'Cleared', value: cleared, color: '#10b981', percentage: total > 0 ? (cleared / total * 100) : 0 },
      { label: 'Violations', value: violations, color: '#ef4444', percentage: total > 0 ? (violations / total * 100) : 0 },
      { label: 'Others', value: others, color: '#6b7280', percentage: total > 0 ? (others / total * 100) : 0 }
    ].filter(item => item.value > 0);
    
    console.log('✅ Chart Data:', chartData);
    return chartData;
  });

  // Todo list - pending tasks
  todoList = computed(() => {
    const apps = this.assignedApplications();
    const todos: Array<{id: string, task: string, priority: string, status: string, applicantName: string}> = [];
    
    apps.forEach(app => {
      if (app.status === 'FLAGGED_FOR_COMPLIANCE') {
        todos.push({
          id: app.id,
          task: `Start investigation for ${app.applicantName}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'PENDING_COMPLIANCE_DOCS') {
        todos.push({
          id: app.id,
          task: `Review documents for ${app.applicantName}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'COMPLIANCE_REVIEW') {
        todos.push({
          id: app.id,
          task: `Complete investigation for ${app.applicantName}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      }
    });
    
    // Sort by priority: CRITICAL > HIGH > MEDIUM > LOW
    const priorityOrder: {[key: string]: number} = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return todos.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Load dashboard data
   */
  loadDashboard(): void {
    this.isLoading.set(true);
    let dashboardLoaded = false;
    let applicationsLoaded = false;
    let completedLoaded = false;
    
    const checkComplete = () => {
      if (dashboardLoaded && applicationsLoaded && completedLoaded) {
        this.isLoading.set(false);
      }
    };
    
    // Load both dashboard stats and assigned applications
    this.complianceService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        dashboardLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.error('❌ Error loading dashboard:', error);
        this.notificationService.error('Error', 'Failed to load dashboard data');
        dashboardLoaded = true;
        checkComplete();
      }
    });

    // Load completed applications (READY_FOR_DECISION) for compliance decision count
    this.complianceService.getCompletedApplications().subscribe({
      next: (apps) => {
        this.completedApplications.set(apps);
        completedLoaded = true;
        checkComplete();
      },
      error: () => {
        completedLoaded = true;
        checkComplete();
      }
    });
    // Load assigned applications for top 5 and todos
    this.complianceService.getAssignedApplications().subscribe({
      next: (apps) => {
        this.assignedApplications.set(apps);
        applicationsLoaded = true;
        console.log('✅ Applications loaded:', apps.length);
        checkComplete();
      },
      error: (error) => {
        console.error('❌ Error loading applications:', error);
        applicationsLoaded = true;
        checkComplete();
      }
    });
  }

  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.notificationService.info('Refreshing', 'Reloading dashboard...');
    this.loadDashboard();
  }


  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800',
      'COMPLIANCE_REVIEW': 'bg-yellow-100 text-yellow-800',
      'PENDING_COMPLIANCE_DOCS': 'bg-orange-100 text-orange-800',
      'READY_FOR_DECISION': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge color
   */
  getPriorityBadgeColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format date for display
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format loan type
   */
  formatLoanType(loanType: string | null | undefined): string {
    if (!loanType) return 'N/A';
    return loanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Navigate to application details
   */
  viewApplication(applicationId: string): void {
    // Encode the ID for secure URL and pass as query parameter
    const encodedId = this.idEncoder.encodeId(applicationId);
    this.router.navigate(['/compliance-officer/applications/review'], {
      queryParams: { ref: encodedId }
    });
  }

  /**
   * Show only first and last name from a full name string
   */
  formatFirstLast(name?: string | null): string {
    if (!name) return 'N/A';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'N/A';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }

  /**
   * Get pie chart SVG path data
   */
  getPieChartPath(data: Array<{percentage: number}>, index: number): string {
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += data[i].percentage;
    }
    
    const angle = data[index].percentage;
    const start = this.angleToPoint(startAngle);
    const end = this.angleToPoint(startAngle + angle);
    const largeArcFlag = angle > 50 ? 1 : 0;
    
    return `M 50,50 L ${start.x},${start.y} A 40,40 0 ${largeArcFlag},1 ${end.x},${end.y} Z`;
  }

  /**
   * Convert percentage angle to SVG point
   */
  private angleToPoint(percentage: number): {x: number, y: number} {
    const angle = (percentage / 100) * 360 - 90; // Start from top
    const rad = (angle * Math.PI) / 180;
    return {
      x: 50 + 40 * Math.cos(rad),
      y: 50 + 40 * Math.sin(rad)
    };
  }
}
