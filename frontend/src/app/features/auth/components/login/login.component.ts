import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, LoginRequest } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals for reactive state
  isLoading = this.authService.isLoading;
  showPassword = signal(false);
  loginError = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    emailOrPhone: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8)
    ]],
    rememberMe: [false]
  });

  constructor() {
    // Clear any existing auth state
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginError.set(null);
      
      const loginData: LoginRequest = {
        emailOrPhone: this.loginForm.value.emailOrPhone.trim(),
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe || false
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.notificationService.loginSuccess(response.email);
          this.redirectToDashboard();
        },
        error: (error) => {
          console.error('Login error:', error);
          const errorMessage = this.getErrorMessage(error);
          this.loginError.set(errorMessage);
          this.notificationService.loginError(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
      }
    }
    
    return null;
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Get user-friendly field labels
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      emailOrPhone: 'Email or Phone',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Extract error message from API response
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Login failed. Please check your credentials and try again.';
  }

  /**
   * Redirect user to appropriate dashboard based on role
   */
  private redirectToDashboard(): void {
    const user = this.authService.currentUser();
    
    if (user) {
      switch (user.role) {
        case 'APPLICANT':
          this.router.navigate(['/applicant/dashboard']);
          break;
        case 'LOAN_OFFICER':
        case 'SENIOR_LOAN_OFFICER':
          this.router.navigate(['/loan-officer/dashboard']);
          break;
        case 'COMPLIANCE_OFFICER':
        case 'SENIOR_COMPLIANCE_OFFICER':
          this.router.navigate(['/compliance-officer/dashboard']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin/dashboard']);
          break;
        default:
          this.router.navigate(['/applicant/dashboard']);
      }
    } else {
      this.router.navigate(['/applicant/dashboard']);
    }
  }
}