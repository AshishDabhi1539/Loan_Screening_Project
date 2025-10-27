import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  action?: string;
  badge?: number;
  children?: MenuItem[];
  roles?: string[];
  isActive?: boolean;
  isExpanded?: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() isCollapsed = signal<boolean>(false);
  @Input() currentUser = signal<User | null>(null);
  @Input() activeRoute = signal<string>('');
  
  @Output() menuItemClick = new EventEmitter<MenuItem>();
  @Output() toggleCollapse = new EventEmitter<void>();

  constructor(private router: Router) {}

  // Default menu items - can be customized per role
  menuItems = signal<MenuItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['APPLICANT', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'ADMIN']
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: 'description',
      roles: ['APPLICANT', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER'],
      children: [
        {
          id: 'my-applications',
          label: 'My Applications',
          icon: 'person',
          route: '/applications/my-applications',
          roles: ['APPLICANT']
        },
        {
          id: 'new-application',
          label: 'New Application',
          icon: 'add',
          route: '/applications/new',
          roles: ['APPLICANT']
        },
        {
          id: 'review-applications',
          label: 'Review Applications',
          icon: 'rate_review',
          route: '/applications/review',
          roles: ['LOAN_OFFICER']
        },
        {
          id: 'flagged-applications',
          label: 'Flagged Applications',
          icon: 'flag',
          route: '/applications/flagged',
          roles: ['COMPLIANCE_OFFICER'],
          badge: 0
        }
      ]
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'folder',
      route: '/documents',
      roles: ['APPLICANT', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER']
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'assessment',
      roles: ['LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'ADMIN'],
      children: [
        {
          id: 'application-reports',
          label: 'Application Reports',
          icon: 'bar_chart',
          route: '/reports/applications',
          roles: ['LOAN_OFFICER', 'ADMIN']
        },
        {
          id: 'compliance-reports',
          label: 'Compliance Reports',
          icon: 'security',
          route: '/reports/compliance',
          roles: ['COMPLIANCE_OFFICER', 'ADMIN']
        }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: 'people',
      route: '/users',
      roles: ['ADMIN']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: '/settings',
      roles: ['APPLICANT', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'ADMIN']
    }
  ]);

  get filteredMenuItems(): MenuItem[] {
    const userRole = this.currentUser()?.role;
    if (!userRole) return [];

    return this.menuItems().filter(item => 
      !item.roles || item.roles.includes(userRole)
    ).map(item => ({
      ...item,
      children: item.children?.filter(child => 
        !child.roles || child.roles.includes(userRole)
      ),
      isActive: this.isMenuItemActive(item)
    }));
  }

  isMenuItemActive(item: MenuItem): boolean {
    const currentRoute = this.activeRoute() || this.router.url;
    
    if (item.route) {
      return currentRoute === item.route || currentRoute.startsWith(item.route + '/');
    }
    
    if (item.children) {
      return item.children.some(child => 
        child.route && (currentRoute === child.route || currentRoute.startsWith(child.route + '/'))
      );
    }
    
    return false;
  }

  onMenuItemClick(item: MenuItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Handle parent items with children
    if (item.children && item.children.length > 0) {
      item.isExpanded = !item.isExpanded;
      return;
    }

    // Handle navigation
    if (item.route) {
      this.router.navigate([item.route]);
    }

    // Emit event for custom handling
    this.menuItemClick.emit(item);

    // Auto-collapse on mobile after navigation
    if (window.innerWidth <= 768) {
      this.onToggleCollapse();
    }
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  getMenuIcon(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'dashboard': '📊',
      'description': '📄',
      'person': '👤',
      'add': '➕',
      'rate_review': '📝',
      'flag': '🚩',
      'folder': '📁',
      'assessment': '📈',
      'bar_chart': '📊',
      'security': '🔒',
      'people': '👥',
      'settings': '⚙️'
    };
    return iconMap[iconName] || '📄';
  }

  setBadgeCount(menuId: string, count: number): void {
    const updateBadge = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === menuId) {
          return { ...item, badge: count };
        }
        if (item.children) {
          return { ...item, children: updateBadge(item.children) };
        }
        return item;
      });
    };

    this.menuItems.set(updateBadge(this.menuItems()));
  }

  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'APPLICANT': 'Applicant',
      'LOAN_OFFICER': 'Loan Officer',
      'SENIOR_LOAN_OFFICER': 'Senior Loan Officer',
      'COMPLIANCE_OFFICER': 'Compliance Officer',
      'SENIOR_COMPLIANCE_OFFICER': 'Senior Compliance Officer',
      'ADMIN': 'Administrator'
    };
    return roleMap[role] || role;
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }
}
