import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InAppNotificationService } from '../../../core/services/in-app-notification.service';
import { InAppNotification, NOTIFICATION_CONFIGS } from '../../../core/models/in-app-notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  // Signals from service
  unreadCount = this.notificationService.unreadCount;
  hasUnread = this.notificationService.hasUnread;
  notifications = this.notificationService.notifications;
  loading = this.notificationService.loading;

  // Local state
  showDropdown = signal(false);
  recentNotifications = signal<InAppNotification[]>([]);

  // Config
  readonly NOTIFICATION_CONFIGS = NOTIFICATION_CONFIGS;

  private refreshInterval: any;

  constructor(public notificationService: InAppNotificationService) {}

  ngOnInit(): void {
    // Initial load
    this.loadNotifications();

    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (!this.showDropdown()) {
        this.loadNotifications();
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Load notifications - show same notifications as main page (newest first)
   */
  loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe();
    
    // Use the same endpoint as main notifications page to ensure consistency
    this.notificationService.getNotifications(0, 50, undefined, undefined).subscribe(page => {
      const notifications = page.content;
      
      // Filter notifications from last 7 days only
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentOnly = notifications.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate >= sevenDaysAgo;
      });
      
      // Sort by creation date - NEWEST FIRST
      const sortedNotifications = recentOnly.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      // Show only top 5 most recent notifications
      this.recentNotifications.set(sortedNotifications.slice(0, 5));
    });
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown(): void {
    this.showDropdown.set(!this.showDropdown());
    
    if (this.showDropdown()) {
      this.loadNotifications();
    }
  }

  /**
   * Close dropdown
   */
  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  /**
   * Mark single notification as read
   */
  markAsRead(notification: InAppNotification, event: Event): void {
    event.stopPropagation();
    
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(event: Event): void {
    event.stopPropagation();
    
    this.notificationService.markAllAsRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  /**
   * Get notification config
   */
  getNotificationConfig(notification: InAppNotification) {
    return NOTIFICATION_CONFIGS[notification.priority] || NOTIFICATION_CONFIGS.INFO;
  }

  /**
   * Get time ago string
   */
  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return notificationDate.toLocaleDateString();
  }

  /**
   * Handle notification click
   */
  onNotificationClick(notification: InAppNotification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Close dropdown
    this.closeDropdown();

    // Navigation will be handled by routerLink in template
  }
}
