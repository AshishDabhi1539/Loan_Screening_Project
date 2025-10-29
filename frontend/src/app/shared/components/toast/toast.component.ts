import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subscription } from 'rxjs';

import { NotificationService, NotificationMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          stagger('100ms', animate('300ms ease-in-out', style({ transform: 'translateX(0%)', opacity: 1 })))
        ], { optional: true }),
        query(':leave', [
          stagger('100ms', animate('300ms ease-in-out', style({ transform: 'translateX(100%)', opacity: 0 })))
        ], { optional: true })
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private subscription?: Subscription;

  notifications = this.notificationService.notifications;

  ngOnInit(): void {
    // Subscribe to new notifications for additional handling if needed
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      // Could add sound effects, browser notifications, etc.
      console.log('New notification:', notification);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Close notification manually
   */
  closeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  /**
   * Get icon for notification type
   */
  getIcon(type: NotificationMessage['type']): string {
    switch (type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  /**
   * Get CSS classes for notification type
   */
  getNotificationClasses(type: NotificationMessage['type']): string {
    const baseClasses = 'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-400`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-400`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-400`;
      case 'info':
        return `${baseClasses} border-l-4 border-blue-400`;
      default:
        return `${baseClasses} border-l-4 border-gray-400`;
    }
  }

  /**
   * Get icon color classes
   */
  getIconClasses(type: NotificationMessage['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationService.clearAll();
  }
}
