import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../toast/toast.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  roles: string[];
  children?: NavigationItem[];
}

export interface Breadcrumb {
  label: string;
  route: string | null;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, NotificationBellComponent],
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
  breadcrumbs = signal<Breadcrumb[]>([]);
  profilePhotoUrl = signal<string | null>(null);

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
      label: 'Notifications',
      route: '/notifications',
      icon: 'M10 21h4a2 2 0 0 1-4 0zm9-5V11a7 7 0 0 0-14 0v5l-2 2v1h18v-1l-2-2z',
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
      label: 'Post-Compliance Review',
      route: '/loan-officer/applications/post-compliance',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },
    {
      label: 'Ready for Decision',
      route: '/loan-officer/applications/ready-for-decision',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },
    {
      label: 'Application History',
      route: '/loan-officer/applications/completed',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: 'M10 21h4a2 2 0 0 1-4 0zm9-5V11a7 7 0 0 0-14 0v5l-2 2v1h18v-1l-2-2z',
      roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER']
    },

    // Compliance Officer Navigation
    {
      label: 'Officer Dashboard',
      route: '/compliance-officer/dashboard',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'Assigned Applications',
      route: '/compliance-officer/applications',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'Ready for Decision',
      route: '/compliance-officer/decision',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'Application History',
      route: '/compliance-officer/history',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'My Profile',
      route: '/compliance-officer/profile',
      icon: 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z',
      roles: ['COMPLIANCE_OFFICER', 'SENIOR_COMPLIANCE_OFFICER']
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: 'M10 21h4a2 2 0 0 1-4 0zm9-5V11a7 7 0 0 0-14 0v5l-2 2v1h18v-1l-2-2z',
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
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: 'M15 17h5l-5 5v-5zM4.868 19.718c.064-.316.106-.648.126-.99C5.126 16.729 6.881 15 9.083 15h5.834c2.202 0 3.957 1.729 4.089 3.728.02.342.062.674.126.99M9 12a3 3 0 006 0v-1a3 3 0 00-6 0v1z',
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
    // Listen to route changes and update page title and breadcrumbs
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
      this.updateBreadcrumbs();
    });
    
    // Set initial page title and breadcrumbs
    this.updatePageTitle();
    this.updateBreadcrumbs();
    
    // Load profile photo from localStorage
    this.loadProfilePhoto();
    
    // Listen for profile photo updates
    window.addEventListener('profilePhotoUpdated', () => {
      this.loadProfilePhoto();
    });
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
        this.pageTitle.set('Employment & Financial Details');
      } else if (segments.includes('personal-details')) {
        this.pageTitle.set('Personal Details');
      } else if (segments.includes('notifications')) {
        this.pageTitle.set('Notifications');
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
   * Generate breadcrumbs based on current route
   */
  private updateBreadcrumbs(): void {
    const currentUrl = this.router.url;
    const urlWithoutQuery = currentUrl.split('?')[0];
    const segments = urlWithoutQuery.split('/').filter(s => s);
    
    const crumbs: Breadcrumb[] = [];
    
    // Route label mapping
    const routeLabels: { [key: string]: string } = {
      'applications': 'My Applications',
      'application-details': 'Application Details',
      'document-upload': 'Document Upload',
      'employment-details': 'Employment Details',
      'application-summary': 'Application Summary',
      'document-resubmission': 'Document Resubmission',
      'compliance-document-resubmission': 'Document Resubmission',
      'document-viewer': 'Documents',
      'apply-loan': 'Apply for Loan',
      'personal-details': 'Personal Details',
      'profile': 'Profile',
      'assigned': 'Assigned Applications',
      'post-compliance': 'Post-Compliance Review',
      'ready-for-decision': 'Ready for Decision',
      'completed': 'Application History',
      'decision': 'Ready for Decision',
      'history': 'Application History'
    };
    
    // Find the best matching navigation item (parent route)
    let matchedNavItem: NavigationItem | null = null;
    let matchedPath = '';
    
    // Try to find the longest matching navigation item
    for (const navItem of this.navigationItems) {
      const navSegments = navItem.route.split('/').filter(s => s);
      if (navSegments.length > 0 && segments.length >= navSegments.length) {
        // Check if all nav segments match
        const matches = navSegments.every((seg, idx) => segments[idx] === seg);
        if (matches && navItem.route.length > matchedPath.length) {
          matchedNavItem = navItem;
          matchedPath = navItem.route;
        }
      }
    }
    
    // Start breadcrumb from the matched navigation item
    if (matchedNavItem) {
      const navSegments = matchedNavItem.route.split('/').filter(s => s);
      const isExactMatch = segments.length === navSegments.length || 
                          (segments.length === navSegments.length + 1 && 
                           /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[navSegments.length]));
      
      // Add the navigation item as first breadcrumb (clickable if not exact match)
      crumbs.push({
        label: matchedNavItem.label,
        route: isExactMatch ? null : matchedNavItem.route
      });
      
      // Add child segments after the nav item
      for (let i = navSegments.length; i < segments.length; i++) {
        const segment = segments[i];
        
        // Skip UUIDs
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
        if (isUUID) {
          continue;
        }
        
        const isLast = i === segments.length - 1 || 
                      (i === segments.length - 2 && segments[i + 1] && 
                       /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[i + 1]));
        
        let label = routeLabels[segment] || segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Build parent route for nested items
        let route: string | null = null;
        if (!isLast) {
          const parentSegments = segments.slice(0, i + 1);
          route = '/' + parentSegments.join('/');
        }
        
        // Special handling for nested routes
        if (segment === 'application-details' && segments.includes('applications')) {
          route = '/applicant/applications';
        } else if (segment === 'document-viewer' && segments.includes('applications')) {
          route = '/applicant/applications';
        } else if (segment === 'employment-details') {
          route = '/applicant/apply-loan';
        } else if (segment === 'document-upload') {
          // Document upload is part of loan application flow
          if (segments.includes('apply-loan') || segments.includes('employment-details')) {
            route = '/applicant/apply-loan';
          }
        }
        
        if (label && !crumbs.some(c => c.label === label)) {
          crumbs.push({ label, route });
        }
      }
    } else {
      // No matching nav item found, build breadcrumbs from segments
      let currentPath = '';
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        // Skip UUIDs
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
        if (isUUID) {
          continue;
        }
        
        currentPath += '/' + segment;
        const isLast = i === segments.length - 1 || 
                      (i === segments.length - 2 && segments[i + 1] && 
                       /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[i + 1]));
        
        let label = routeLabels[segment] || segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        const route: string | null = isLast ? null : currentPath;
        
        if (label && !crumbs.some(c => c.label === label)) {
          crumbs.push({ label, route });
        }
      }
    }
    
    // If no breadcrumbs generated, add Dashboard as fallback
    if (crumbs.length === 0) {
      const role = this.userRole();
      let dashboardRoute = '/applicant/dashboard';
      
      if (role === 'APPLICANT') {
        dashboardRoute = '/applicant/dashboard';
      } else if (role === 'LOAN_OFFICER' || role === 'SENIOR_LOAN_OFFICER') {
        dashboardRoute = '/loan-officer/dashboard';
      } else if (role === 'COMPLIANCE_OFFICER' || role === 'SENIOR_COMPLIANCE_OFFICER') {
        dashboardRoute = '/compliance-officer/dashboard';
      } else if (role === 'ADMIN') {
        dashboardRoute = '/admin/dashboard';
      }
      
      crumbs.push({ label: 'Dashboard', route: dashboardRoute });
    }
    
    this.breadcrumbs.set(crumbs);
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

  /**
   * Load profile photo from localStorage
   */
  private loadProfilePhoto(): void {
    const user = this.currentUser();
    if (user?.email) {
      const photoKey = `profile_photo_${user.email}`;
      const photoUrl = localStorage.getItem(photoKey);
      this.profilePhotoUrl.set(photoUrl);
    }
  }

  /**
   * Get user initials (first + last name)
   */
  getUserInitials(): string {
    const displayName = this.userDisplayName();
    const nameParts = displayName.trim().split(/\s+/);
    
    if (nameParts.length >= 2) {
      // First letter of first name + first letter of last name
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      // Just first letter of single name
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return 'U'; // Default fallback
  }
}
