import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InAppNotificationService } from '../../../core/services/in-app-notification.service';
import { 
  InAppNotification, 
  NotificationPage, 
  NotificationTypeEnum,
  NOTIFICATION_CONFIGS 
} from '../../../core/models/in-app-notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})
export class NotificationListComponent implements OnInit {
  // Signals
  notificationPage = signal<NotificationPage | null>(null);
  loading = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  
  // Filters
  filterType = signal<'all' | 'unread' | 'read'>('all');
  filterNotificationType = signal<NotificationTypeEnum | null>(null);
  currentPage = signal(0);
  pageSize = signal(10);

  // Computed
  notifications = computed(() => this.notificationPage()?.content || []);
  totalElements = computed(() => this.notificationPage()?.totalElements || 0);
  totalPages = computed(() => this.notificationPage()?.totalPages || 0);
  hasNotifications = computed(() => this.notifications().length > 0);
  hasSelection = computed(() => this.selectedIds().size > 0);
  allSelected = computed(() => {
    const notifications = this.notifications();
    const selected = this.selectedIds();
    return notifications.length > 0 && notifications.every(n => selected.has(n.id));
  });

  // Config
  readonly NOTIFICATION_CONFIGS = NOTIFICATION_CONFIGS;
  readonly NotificationTypeEnum = NotificationTypeEnum;

  constructor(private notificationService: InAppNotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  /**
   * Load notifications with current filters
   */
  loadNotifications(): void {
    this.loading.set(true);
    
    const isRead = this.filterType() === 'all' ? undefined : this.filterType() === 'read';
    const type = this.filterNotificationType();

    this.notificationService.getNotifications(
      this.currentPage(),
      this.pageSize(),
      isRead,
      type || undefined
    ).subscribe(page => {
      this.notificationPage.set(page);
      this.loading.set(false);
    });
  }

  /**
   * Change filter type
   */
  onFilterTypeChange(type: 'all' | 'unread' | 'read'): void {
    this.filterType.set(type);
    this.currentPage.set(0);
    this.selectedIds.set(new Set());
    this.loadNotifications();
  }

  /**
   * Change notification type filter
   */
  onNotificationTypeChange(type: NotificationTypeEnum | null): void {
    this.filterNotificationType.set(type);
    this.currentPage.set(0);
    this.selectedIds.set(new Set());
    this.loadNotifications();
  }

  /**
   * Toggle single notification selection
   */
  toggleSelection(id: number): void {
    const selected = new Set(this.selectedIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedIds.set(selected);
  }

  /**
   * Toggle all notifications selection
   */
  toggleSelectAll(): void {
    const notifications = this.notifications();
    const selected = new Set(this.selectedIds());
    
    if (this.allSelected()) {
      // Deselect all
      notifications.forEach(n => selected.delete(n.id));
    } else {
      // Select all
      notifications.forEach(n => selected.add(n.id));
    }
    
    this.selectedIds.set(selected);
  }

  /**
   * Mark selected as read
   */
  markSelectedAsRead(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.notificationService.markSelectedAsRead(ids).subscribe(() => {
      this.selectedIds.set(new Set());
      this.loadNotifications();
    });
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.selectedIds.set(new Set());
      this.loadNotifications();
    });
  }

  /**
   * Mark single as read
   */
  markAsRead(notification: InAppNotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  /**
   * Go to page
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.selectedIds.set(new Set());
    this.loadNotifications();
  }

  /**
   * Previous page
   */
  previousPage(): void {
    if (this.currentPage() > 0) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Next page
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.goToPage(this.currentPage() + 1);
    }
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
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 0; i < total; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and 2 on each side
      pages.push(0);
      
      if (current > 3) pages.push(-1); // Ellipsis
      
      for (let i = Math.max(1, current - 2); i <= Math.min(total - 2, current + 2); i++) {
        pages.push(i);
      }
      
      if (current < total - 4) pages.push(-1); // Ellipsis
      
      pages.push(total - 1);
    }

    return pages;
  }
}
