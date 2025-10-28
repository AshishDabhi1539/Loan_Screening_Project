import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals for reactive state
  isLoading = this.authService.isLoading;
  verificationError = signal<string | null>(null);
  verificationSuccess = signal(false);
  email = signal<string>('');
  isResendingOtp = signal(false);
  resendCooldown = signal(0);
  
  verifyForm: FormGroup = this.fb.group({
    otpCode: ['', [
      Validators.required,
      Validators.pattern(/^\d{6}$/),
      Validators.minLength(6),
      Validators.maxLength(6)
    ]]
  });

  private cooldownInterval?: any;

  ngOnInit(): void {
    // Get email from query params (from registration redirect)
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email.set(params['email']);
      }
    });

    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/applicant/dashboard']);
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.verifyForm.valid && this.email()) {
      this.verificationError.set(null);
      
      const email = this.email();
      const otpCode = this.verifyForm.value.otpCode.trim();

      this.authService.verifyEmail(email, otpCode).subscribe({
        next: (response) => {
          this.verificationSuccess.set(true);
          this.notificationService.success(
            'Email Verified!', 
            'Your account has been successfully verified. You can now sign in.'
          );
          
          // Navigate to login after short delay
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: { email: this.email() }
            });
          }, 2000);
        },
        error: (error) => {
          console.error('Verification error:', error);
          const errorMessage = this.getErrorMessage(error);
          this.verificationError.set(errorMessage);
          this.notificationService.error('Verification Failed', errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Resend OTP
   */
  resendOtp(): void {
    if (!this.email() || this.isResendingOtp() || this.resendCooldown() > 0) {
      return;
    }

    this.isResendingOtp.set(true);
    this.verificationError.set(null);

    this.authService.resendVerificationOtp(this.email()).subscribe({
      next: (response) => {
        this.notificationService.success(
          'OTP Sent!', 
          'A new verification code has been sent to your email.'
        );
        this.startResendCooldown();
        this.isResendingOtp.set(false);
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        const errorMessage = this.getErrorMessage(error);
        this.notificationService.error('Failed to Resend OTP', errorMessage);
        this.isResendingOtp.set(false);
      }
    });
  }

  /**
   * Start cooldown timer for resend button
   */
  private startResendCooldown(): void {
    this.resendCooldown.set(60); // 60 seconds cooldown
    
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current > 0) {
        this.resendCooldown.set(current - 1);
      } else {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  /**
   * Handle OTP input formatting
   */
  onOtpInput(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    this.verifyForm.patchValue({ otpCode: value });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string | null {
    const field = this.verifyForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Verification code is required';
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid 6-digit verification code';
      }
      if (field.errors['minlength'] || field.errors['maxlength']) {
        return 'Verification code must be exactly 6 digits';
      }
    }
    
    return null;
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.verifyForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.verifyForm.controls).forEach(key => {
      this.verifyForm.get(key)?.markAsTouched();
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
    return 'Verification failed. Please check your code and try again.';
  }

  /**
   * Navigate back to registration
   */
  goBackToRegistration(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Navigate to login
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: this.email() ? { email: this.email() } : {}
    });
  }
}
