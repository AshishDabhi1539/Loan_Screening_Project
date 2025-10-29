import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<NotificationMessage[]>([]);
  private notificationSubject = new Subject<NotificationMessage>();

  readonly notifications = this._notifications.asReadonly();
  readonly notification$ = this.notificationSubject.asObservable();

  /**
   * Show success notification
   */
  success(title: string, message: string, duration: number = 5000): void {
    this.addNotification('success', title, message, duration);
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, persistent: boolean = false): void {
    this.addNotification('error', title, message, persistent ? 0 : 8000, persistent);
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, duration: number = 6000): void {
    this.addNotification('warning', title, message, duration);
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, duration: number = 5000): void {
    this.addNotification('info', title, message, duration);
  }

  /**
   * Add notification to the list
   */
  private addNotification(
    type: NotificationMessage['type'],
    title: string,
    message: string,
    duration: number = 5000,
    persistent: boolean = false
  ): void {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      persistent,
      timestamp: new Date()
    };

    // Add to signals array
    this._notifications.update(notifications => [...notifications, notification]);

    // Emit to observable
    this.notificationSubject.next(notification);

    // Auto-remove after duration (if not persistent)
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  /**
   * Remove notification by ID
   */
  removeNotification(id: string): void {
    this._notifications.update(notifications => 
      notifications.filter(notification => notification.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this._notifications.set([]);
  }

  /**
   * Clear notifications by type
   */
  clearByType(type: NotificationMessage['type']): void {
    this._notifications.update(notifications => 
      notifications.filter(notification => notification.type !== type)
    );
  }

  /**
   * Generate unique ID for notification
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Quick methods for common scenarios
   */
  
  // Authentication related
  loginSuccess(username: string): void {
    this.success('Login Successful', `Welcome back, ${username}!`);
  }

  loginError(message: string): void {
    this.error('Login Failed', message);
  }

  logoutSuccess(): void {
    this.info('Logged Out', 'You have been successfully logged out.');
  }

  // Application related
  applicationSubmitted(): void {
    this.success('Application Submitted', 'Your loan application has been submitted successfully.');
  }

  applicationStatusChanged(status: string): void {
    this.info('Status Update', `Your application status has been updated to: ${status}`);
  }

  documentUploaded(filename: string): void {
    this.success('Document Uploaded', `${filename} has been uploaded successfully.`);
  }

  documentUploadError(filename: string, error: string): void {
    this.error('Upload Failed', `Failed to upload ${filename}: ${error}`);
  }

  // Officer related
  applicationAssigned(applicationId: string): void {
    this.info('New Assignment', `Application ${applicationId} has been assigned to you.`);
  }

  decisionSubmitted(decision: string): void {
    this.success('Decision Submitted', `Your ${decision} decision has been recorded.`);
  }

  // System related
  systemError(message: string): void {
    this.error('System Error', message, true);
  }

  connectionError(): void {
    this.error('Connection Error', 'Unable to connect to the server. Please check your internet connection.', true);
  }

  maintenanceMode(): void {
    this.warning('Maintenance Mode', 'The system is currently under maintenance. Some features may be unavailable.');
  }
}
