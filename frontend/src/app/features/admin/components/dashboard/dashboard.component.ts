import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdminService, AdminStats, RecentActivity } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  // Signals for reactive state
  currentUser = this.authService.currentUser;
  isLoading = signal(false);
  
  // Admin-specific stats
  adminStats = signal<AdminStats>({
    totalUsers: 0,
    totalOfficers: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    systemHealth: 'good',
    activeUsers: 0
  });

  recentActivities = signal<RecentActivity[]>([]);
  
  // Computed values
  userDisplayName = computed(() => {
    const user = this.currentUser();
    return user?.displayName || user?.email?.split('@')[0] || 'Admin';
  });

  systemHealthColor = computed(() => {
    const health = this.adminStats().systemHealth;
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  });

  ngOnInit(): void {
    this.loadAdminData();
  }

  /**
   * Load admin dashboard data from backend
   */
  private loadAdminData(): void {
    this.isLoading.set(true);
    
    // Load real data from backend
    this.adminService.getAdminDashboardData().subscribe({
      next: (data) => {
        this.adminStats.set(data.stats);
        this.recentActivities.set(data.recentActivities);
        this.isLoading.set(false);
        console.log('✅ Admin dashboard data loaded successfully:', data);
      },
      error: (error) => {
        console.error('❌ Failed to load admin dashboard data:', error);
        this.notificationService.error('Error', 'Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
        
        // Set empty data on error
        this.adminStats.set({
          totalUsers: 0,
          totalOfficers: 0,
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          systemHealth: 'critical',
          activeUsers: 0
        });
        this.recentActivities.set([]);
      }
    });
  }

  /**
   * Get greeting based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      case 'OFFICER_CREATED':
        return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z';
      case 'APPLICATION_SUBMITTED':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'APPLICATION_APPROVED':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'APPLICATION_REJECTED':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  /**
   * Get activity color based on type
   */
  getActivityColor(type: string): string {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'text-blue-600 bg-blue-100';
      case 'OFFICER_CREATED':
        return 'text-purple-600 bg-purple-100';
      case 'APPLICATION_SUBMITTED':
        return 'text-yellow-600 bg-yellow-100';
      case 'APPLICATION_APPROVED':
        return 'text-green-600 bg-green-100';
      case 'APPLICATION_REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.notificationService.info('Refreshing', 'Updating admin dashboard...');
    this.loadAdminData();
  }

  /**
   * Test backend connection
   */
  testBackendConnection(): void {
    console.log('🔍 Testing admin backend connection...');
    console.log('Current admin user:', this.currentUser());
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('User role:', this.authService.userRole());
    
    // Test actual API connection
    this.adminService.testConnection().subscribe({
      next: (result) => {
        console.log('✅ Admin API Test Result:', result);
        if (result.status === 'success') {
          this.notificationService.success('API Test', `Connection successful! Found ${result.data?.officerCount || 0} officers.`);
        } else {
          this.notificationService.warning('API Test', result.message);
        }
      },
      error: (error) => {
        console.error('❌ Admin API Test Failed:', error);
        this.notificationService.error('API Test', 'Connection failed. Check console for details.');
      }
    });
  }

  /**
   * Quick action handlers
   */
  createOfficer(): void {
    this.notificationService.info('Create Officer', 'Opening officer creation form...');
    this.router.navigate(['/admin/officers/create']);
  }

  viewAllUsers(): void {
    this.notificationService.info('User Management', 'Opening user management panel...');
    // TODO: Navigate to user management
  }

  viewSystemReports(): void {
    this.notificationService.info('System Reports', 'Opening system reports...');
    // TODO: Navigate to reports
  }

  manageSettings(): void {
    this.notificationService.info('System Settings', 'Opening system configuration...');
    // TODO: Navigate to settings
  }
}