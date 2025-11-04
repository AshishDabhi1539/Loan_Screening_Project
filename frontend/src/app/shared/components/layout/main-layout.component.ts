import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../toast/toast.component';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  roles: string[];
  children?: NavigationItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Auth state
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  userRole = this.authService.userRole;

  // UI state
  sidebarOpen = signal(true);
  userMenuOpen = signal(false);
  mobileMenuOpen = signal(false);
  pageTitle = signal('Dashboard');

  // Navigation items based on roles
  private navigationItems: NavigationItem[] = [
    // Applicant Navigation
    {
      label: 'Dashboard',
      route: '/applicant/dashboard',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      roles: ['APPLICANT']
    },
    {
      label: 'Apply for Loan',
      route: '/applicant/apply-loan',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      roles: ['APPLICANT']
    },
    {
      label: 'My Applications',
      route: '/applicant/applications',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      roles: ['APPLICANT']
    },
    {
      label: 'Profile',
      route: '/applicant/profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      roles: ['APPLICANT']
    },

    // Loan Officer Navigation
    {
      label: 'Officer Dashboard',
      route: '/loan-officer/dashboard',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },
    {
      label: 'Assigned Applications',
      route: '/loan-officer/applications/assigned',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },
    {
      label: 'Pending Documents',
      route: '/loan-officer/applications/pending-documents',
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },
    {
      label: 'Ready for Decision',
      route: '/loan-officer/applications/ready-for-decision',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },

    // Compliance Officer Navigation
    {
      label: 'Compliance Dashboard',
      route: '/compliance-officer/dashboard',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'My Applications',
      route: '/compliance-officer/applications',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'Decision',
      route: '/compliance-officer/decision',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },

    // Admin Navigation
    {
      label: 'Admin Dashboard',
      route: '/admin/dashboard',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      roles: ['ADMIN']
    },
    {
      label: 'Create Officer',
      route: '/admin/officers/create',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      roles: ['ADMIN']
    },
    {
      label: 'Officer Management',
      route: '/admin/users/officers',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      roles: ['ADMIN']
    },
    {
      label: 'Applicant Management',
      route: '/admin/users/applicants',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      roles: ['ADMIN']
    },
    {
      label: 'System Reports',
      route: '/admin/system/reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      roles: ['ADMIN']
    }
  ];

  // Filtered navigation based on user role
  visibleNavigation = computed(() => {
    const role = this.userRole();
    if (!role) return [];
    
    return this.navigationItems.filter(item => 
      item.roles.includes(role)
    );
  });

  // User display name
  userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Guest';
    
    // If displayName exists, use it
    if (user.displayName) {
      return user.displayName;
    }
    
    // If email exists, extract username part (before @)
    if (user.email) {
      const username = user.email.split('@')[0];
      // Capitalize first letter and make it more readable
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    
    return 'User';
  });

  constructor() {
    // Listen to route changes and update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });
    
    // Set initial page title
    this.updatePageTitle();
  }

  /**
   * Update page title based on current route
   */
  private updatePageTitle(): void {
    const currentUrl = this.router.url;
    
    // Remove query parameters from URL (e.g., ?mode=view)
    const urlWithoutQuery = currentUrl.split('?')[0];
    
    // Find matching navigation item
    const matchingItem = this.navigationItems.find(item => 
      urlWithoutQuery.includes(item.route)
    );
    
    if (matchingItem) {
      this.pageTitle.set(matchingItem.label);
    } else {
      // Handle special routes with dynamic segments (UUIDs, IDs, etc.)
      const segments = urlWithoutQuery.split('/').filter(s => s);
      
      // Check for specific route patterns
      if (segments.includes('document-resubmission')) {
        this.pageTitle.set('Document Resubmission');
      } else if (segments.includes('application-details')) {
        this.pageTitle.set('Application Details');
      } else if (segments.includes('document-verification')) {
        this.pageTitle.set('Document Verification');
      } else if (segments.includes('application-summary')) {
        this.pageTitle.set('Application Summary');
      } else if (segments.includes('document-upload')) {
        this.pageTitle.set('Document Upload');
      } else if (segments.includes('employment-details')) {
        this.pageTitle.set('Employment Details');
      } else if (segments.includes('personal-details')) {
        this.pageTitle.set('Personal Details');
      } else if (segments.length > 0) {
        // Default: use the last non-UUID segment
        const lastSegment = segments[segments.length - 1];
        
        // Check if last segment is a UUID (contains hyphens and alphanumeric)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
        
        if (isUUID && segments.length > 1) {
          // Use the second-to-last segment if last is UUID
          const secondLastSegment = segments[segments.length - 2];
          const title = secondLastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          this.pageTitle.set(title);
        } else {
          // Convert kebab-case to Title Case
          const title = lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          this.pageTitle.set(title);
        }
      } else {
        this.pageTitle.set('Dashboard');
      }
    }
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  /**
   * Toggle user menu dropdown
   */
  toggleUserMenu(): void {
    this.userMenuOpen.update(open => !open);
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  /**
   * Close all dropdowns
   */
  closeDropdowns(): void {
    this.userMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
  }

  /**
   * Handle logout
   */
  logout(): void {
    this.authService.logout();
    this.notificationService.logoutSuccess();
    this.closeDropdowns();
  }

  /**
   * Navigate to profile
   */
  goToProfile(): void {
    const role = this.userRole();
    switch (role) {
      case 'APPLICANT':
        this.router.navigate(['/applicant/profile']);
        break;
      case 'LOAN_OFFICER':
      case 'SENIOR_LOAN_OFFICER':
        this.router.navigate(['/loan-officer/profile']);
        break;
      case 'COMPLIANCE_OFFICER':
      case 'SENIOR_COMPLIANCE_OFFICER':
        this.router.navigate(['/compliance-officer/profile']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/profile']);
        break;
      default:
        this.router.navigate(['/profile']);
    }
    this.closeDropdowns();
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(): string {
    const role = this.userRole();
    switch (role) {
      case 'APPLICANT':
        return 'Applicant';
      case 'LOAN_OFFICER':
        return 'Loan Officer';
      case 'SENIOR_LOAN_OFFICER':
        return 'Senior Loan Officer';
      case 'COMPLIANCE_OFFICER':
        return 'Compliance Officer';
      case 'SENIOR_COMPLIANCE_OFFICER':
        return 'Senior Compliance Officer';
      case 'ADMIN':
        return 'Administrator';
      default:
        return 'User';
    }
  }

  /**
   * Get role badge color
   */
  getRoleBadgeColor(): string {
    const role = this.userRole();
    switch (role) {
      case 'APPLICANT':
        return 'bg-blue-100 text-blue-800';
      case 'LOAN_OFFICER':
        return 'bg-green-100 text-green-800';
      case 'SENIOR_LOAN_OFFICER':
        return 'bg-green-200 text-green-900';
      case 'COMPLIANCE_OFFICER':
        return 'bg-yellow-100 text-yellow-800';
      case 'SENIOR_COMPLIANCE_OFFICER':
        return 'bg-yellow-200 text-yellow-900';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
