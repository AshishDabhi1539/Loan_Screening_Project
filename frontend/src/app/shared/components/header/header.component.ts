import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  hasPersonalDetails?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() currentUser = signal<User | null>(null);
  @Input() notifications = signal<NotificationItem[]>([]);
  @Input() showNotifications = signal<boolean>(true);
  @Input() showUserMenu = signal<boolean>(true);
  
  @Output() logout = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<NotificationItem>();
  @Output() markAllNotificationsRead = new EventEmitter<void>();

  // UI State
  showNotificationDropdown = signal<boolean>(false);
  showUserDropdown = signal<boolean>(false);

  get unreadNotificationCount(): number {
    return this.notifications().filter(n => !n.isRead).length;
  }

  get recentNotifications(): NotificationItem[] {
    return this.notifications()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown.set(!this.showNotificationDropdown());
    this.showUserDropdown.set(false);
  }

  toggleUserDropdown(): void {
    this.showUserDropdown.set(!this.showUserDropdown());
    this.showNotificationDropdown.set(false);
  }

  onNotificationClick(notification: NotificationItem): void {
    this.notificationClick.emit(notification);
    this.showNotificationDropdown.set(false);
  }

  onProfileClick(): void {
    this.profileClick.emit();
    this.showUserDropdown.set(false);
  }

  onLogout(): void {
    this.logout.emit();
    this.showUserDropdown.set(false);
  }

  onMarkAllRead(): void {
    this.markAllNotificationsRead.emit();
  }

  closeDropdowns(): void {
    this.showNotificationDropdown.set(false);
    this.showUserDropdown.set(false);
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

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'INFO': '📢',
      'WARNING': '⚠️',
      'SUCCESS': '✅',
      'ERROR': '❌'
    };
    return iconMap[type] || '📢';
  }
}
