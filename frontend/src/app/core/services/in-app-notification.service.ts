import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InAppNotification,
  NotificationPage,
  NotificationTypeEnum,
  NotificationPriority
} from '../models/in-app-notification.model';

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;

  // Signals for reactive state management
  private unreadCountSignal = signal<number>(0);
  private notificationsSignal = signal<InAppNotification[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  // Computed signal for has unread
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor(private http: HttpClient) {}

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/unread/count`).pipe(
      tap(count => this.unreadCountSignal.set(count)),
      catchError(error => {
        console.error('Failed to fetch unread count:', error);
        return of(0);
      })
    );
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<InAppNotification[]> {
    this.loadingSignal.set(true);
    return this.http.get<NotificationPage>(`${this.API_URL}/unread`).pipe(
      map(page => page.content),
      tap(notifications => {
        this.notificationsSignal.set(notifications);
        this.unreadCountSignal.set(notifications.length);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Failed to fetch unread notifications:', error);
        this.loadingSignal.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get paginated notifications with filters
   */
  getNotifications(
    page: number = 0,
    size: number = 10,
    isRead?: boolean,
    type?: NotificationTypeEnum
  ): Observable<NotificationPage> {
    this.loadingSignal.set(true);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (isRead !== undefined) {
      params = params.set('isRead', isRead.toString());
    }

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<NotificationPage>(this.API_URL, { params }).pipe(
      tap(() => this.loadingSignal.set(false)),
      catchError(error => {
        console.error('Failed to fetch notifications:', error);
        this.loadingSignal.set(false);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page,
          first: true,
          last: true,
          empty: true
        });
      })
    );
  }

  /**
   * Mark single notification as read
   */
  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/read`, {}).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSignal();
        const updatedNotifications = currentNotifications.map(n =>
          n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
        );
        this.notificationsSignal.set(updatedNotifications);
        
        // Decrease unread count
        const currentCount = this.unreadCountSignal();
        if (currentCount > 0) {
          this.unreadCountSignal.set(currentCount - 1);
        }
      }),
      catchError(error => {
        console.error('Failed to mark notification as read:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSignal();
        const updatedNotifications = currentNotifications.map(n => ({
          ...n,
          isRead: true,
          readAt: new Date()
        }));
        this.notificationsSignal.set(updatedNotifications);
        this.unreadCountSignal.set(0);
      }),
      catchError(error => {
        console.error('Failed to mark all as read:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Mark selected notifications as read
   */
  markSelectedAsRead(ids: number[]): Observable<void> {
    return this.http.patch<number>(`${this.API_URL}/read-selected`, ids).pipe(
      tap((updatedCount) => {
        // Update local state
        const currentNotifications = this.notificationsSignal();
        const updatedNotifications = currentNotifications.map(n =>
          ids.includes(n.id) ? { ...n, isRead: true, readAt: new Date() } : n
        );
        this.notificationsSignal.set(updatedNotifications);
        
        // Decrease unread count
        const currentCount = this.unreadCountSignal();
        this.unreadCountSignal.set(Math.max(0, currentCount - updatedCount));
      }),
      map(() => void 0),
      catchError(error => {
        console.error('Failed to mark selected as read:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Refresh notifications
   */
  refresh(): void {
    this.getUnreadCount().subscribe();
    this.getUnreadNotifications().subscribe();
  }

  /**
   * Add new notification (for SSE)
   */
  addNotification(notification: InAppNotification): void {
    const currentNotifications = this.notificationsSignal();
    this.notificationsSignal.set([notification, ...currentNotifications]);
    
    if (!notification.isRead) {
      const currentCount = this.unreadCountSignal();
      this.unreadCountSignal.set(currentCount + 1);
    }
  }

  /**
   * Clear all notifications from state
   */
  clear(): void {
    this.notificationsSignal.set([]);
    this.unreadCountSignal.set(0);
  }
}
