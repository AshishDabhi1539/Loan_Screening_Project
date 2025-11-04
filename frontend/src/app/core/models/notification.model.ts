/**
 * Notification Models
 * All notification-related interfaces and types
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification message
 */
export interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  timestamp: Date;
}

/**
 * Toast notification options
 */
export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
  icon?: string;
}
