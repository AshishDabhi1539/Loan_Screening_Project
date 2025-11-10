import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { MainLayoutComponent } from './shared/components/layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ToastComponent, MainLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Loan Screening Application';
  
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Expose auth state to template
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  isLoading = this.authService.isLoading;
  
  // Track current route
  currentRoute = '';

  ngOnInit() {
    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
    
    // Set initial route
    this.currentRoute = this.router.url;
  }

  testNotification(type: 'success' | 'error' | 'warning' | 'info') {
    switch (type) {
      case 'success':
        this.notificationService.success('Success!', 'This is a success notification');
        break;
      case 'error':
        this.notificationService.error('Error!', 'This is an error notification');
        break;
      case 'warning':
        this.notificationService.warning('Warning!', 'This is a warning notification');
        break;
      case 'info':
        this.notificationService.info('Info!', 'This is an info notification');
        break;
    }
  }
}
