import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InAppNotification } from '../models/in-app-notification.model';
import { InAppNotificationService } from './in-app-notification.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationSseService {
  private eventSource: EventSource | null = null;
  private readonly SSE_URL = `${environment.apiUrl}/notifications/stream`;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectTimeout: any;

  constructor(
    private notificationService: InAppNotificationService,
    private ngZone: NgZone
  ) {}

  /**
   * Connect to SSE stream
   */
  connect(token: string): void {
    if (this.eventSource) {
      console.log('SSE already connected');
      return;
    }

    console.log('Connecting to SSE stream...');

    // Native EventSource cannot set Authorization headers; backend now supports access_token query param
    const url = `${this.SSE_URL}?access_token=${encodeURIComponent(token)}`;

    this.ngZone.runOutsideAngular(() => {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.ngZone.run(() => {
          console.log('SSE connection established');
          this.reconnectAttempts = 0;
        });
      };

      this.eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const notification: InAppNotification = JSON.parse(event.data);
            console.log('New notification received:', notification);
            
            // Add to notification service
            this.notificationService.addNotification(notification);
            
            // Show browser notification if permitted
            this.showBrowserNotification(notification);
            
            // Play sound (optional)
            this.playNotificationSound();
          } catch (error) {
            console.error('Failed to parse SSE message:', error);
          }
        });
      };

      this.eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('SSE connection error:', error);
          this.handleConnectionError();
        });
      };
    });
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('Disconnecting from SSE stream...');
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(): void {
    this.eventSource?.close();
    this.eventSource = null;

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      this.reconnectTimeout = setTimeout(() => {
        // Try both storages using configured key
        const key = environment.auth.tokenKey;
        const token = localStorage.getItem(key) || sessionStorage.getItem(key);
        // Only reconnect if token exists and is not expired (basic check)
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            // Only reconnect if token is not expired (with 5 min buffer)
            if (payload.exp && payload.exp > (currentTime + 300)) {
              this.connect(token);
            } else {
              console.log('SSE reconnection skipped: token expired');
            }
          } catch (e) {
            console.error('SSE reconnection failed: invalid token', e);
          }
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: InAppNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        tag: notification.id.toString(),
        requireInteraction: notification.priority === 'CRITICAL'
      });
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        // Ignore autoplay errors
        console.debug('Could not play notification sound:', err);
      });
    } catch (error) {
      console.debug('Notification sound not available');
    }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}
