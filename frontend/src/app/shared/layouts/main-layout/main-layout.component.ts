import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

import { HeaderComponent, User, NotificationItem } from '../../components/header/header.component';
import { SidebarComponent, MenuItem } from '../../components/sidebar/sidebar.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    HeaderComponent, 
    SidebarComponent, 
    LoaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Layout state
  sidebarCollapsed = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  currentRoute = signal<string>('');

  // User data - In real app, this would come from AuthService
  currentUser = signal<User | null>({
    id: '1',
    email: 'user@example.com',
    displayName: 'John Doe',
    role: 'APPLICANT'
  });

  // Notifications - In real app, this would come from NotificationService
  notifications = signal<NotificationItem[]>([
    {
      id: '1',
      title: 'Application Status Update',
      message: 'Your loan application has been approved!',
      type: 'SUCCESS',
      isRead: false,
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Document Required',
      message: 'Please upload your income certificate.',
      type: 'WARNING',
      isRead: false,
      createdAt: new Date()
    }
  ]);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Track route changes for sidebar active state
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
      });

    // Set initial route
    this.currentRoute.set(this.router.url);

    // Handle responsive sidebar on mobile
    this.handleResponsiveSidebar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleResponsiveSidebar(): void {
    const checkScreenSize = () => {
      if (window.innerWidth <= 768) {
        this.sidebarCollapsed.set(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
  }

  // Header event handlers
  onLogout(): void {
    // In real app, call AuthService.logout()
    console.log('Logout clicked');
    this.router.navigate(['/auth/login']);
  }

  onProfileClick(): void {
    console.log('Profile clicked');
    this.router.navigate(['/profile']);
  }

  onNotificationClick(notification: NotificationItem): void {
    console.log('Notification clicked:', notification);
    // Mark as read and navigate to relevant page
    this.markNotificationAsRead(notification.id);
  }

  onMarkAllNotificationsRead(): void {
    const updatedNotifications = this.notifications().map(n => ({ ...n, isRead: true }));
    this.notifications.set(updatedNotifications);
  }

  // Sidebar event handlers
  onToggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  onMenuItemClick(menuItem: MenuItem): void {
    console.log('Menu item clicked:', menuItem);
    // Additional custom handling if needed
  }

  // Utility methods
  private markNotificationAsRead(notificationId: string): void {
    const updatedNotifications = this.notifications().map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notifications.set(updatedNotifications);
  }

  // Loading state management
  showLoader(message?: string): void {
    this.isLoading.set(true);
  }

  hideLoader(): void {
    this.isLoading.set(false);
  }

  // Check if current route requires authentication
  get isAuthRoute(): boolean {
    const authRoutes = ['/auth/login', '/auth/register', '/auth/verify-email'];
    return authRoutes.includes(this.currentRoute());
  }

  // Check if sidebar should be shown
  get showSidebar(): boolean {
    return !!this.currentUser() && !this.isAuthRoute;
  }
}
