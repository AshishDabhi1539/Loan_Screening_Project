import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../../../core/models/auth.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals for reactive state
  isLoading = this.authService.isLoading;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  registrationError = signal<string | null>(null);
  registrationSuccess = signal(false);

  registerForm: FormGroup = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(150)
    ]],
    phone: ['', [
      Validators.required,
      Validators.pattern(/^(\+91|91|0)?[6-9]\d{9}$/),
      Validators.minLength(10),
      Validators.maxLength(13)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(100),
      this.passwordStrengthValidator
    ]],
    confirmPassword: ['', [
      Validators.required
    ]],
    acceptTerms: [false, [
      Validators.requiredTrue
    ]]
  }, {
    validators: this.passwordMatchValidator
  });

  constructor() {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/applicant/dashboard']);
    }
  }

  /**
   * Custom validator for password strength
   */
  private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    if (!valid) {
      return {
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar
        }
      };
    }

    return null;
  }

  /**
   * Custom validator for password confirmation
   */
  private passwordMatchValidator(group: AbstractControl): { [key: string]: any } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.update(show => !show);
    } else {
      this.showConfirmPassword.update(show => !show);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.registerForm.valid) {
      this.registrationError.set(null);
      
      const registerData: RegisterRequest = {
        email: this.registerForm.value.email.trim().toLowerCase(),
        phone: this.registerForm.value.phone.trim(),
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        acceptTerms: this.registerForm.value.acceptTerms
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.registrationSuccess.set(true);
          this.notificationService.success(
            'Registration Successful!', 
            'Please check your email for verification instructions.'
          );
          
          // Navigate to email verification with email parameter
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: registerData.email }
          });
        },
        error: (error) => {
          console.error('Registration error:', error);
          const errorMessage = this.getErrorMessage(error);
          this.registrationError.set(errorMessage);
          this.notificationService.error('Registration Failed', errorMessage);
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
    const field = this.registerForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern'] && fieldName === 'phone') {
        return 'Please enter a valid 10-digit Indian mobile number';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
      }
      if (field.errors['passwordStrength']) {
        return this.getPasswordStrengthError(field.errors['passwordStrength']);
      }
      if (field.errors['requiredTrue']) {
        return 'You must accept the terms and conditions';
      }
    }

    // Check for form-level errors
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return null;
  }

  /**
   * Get password strength error message
   */
  private getPasswordStrengthError(strengthInfo: any): string {
    const missing = [];
    if (!strengthInfo.hasUpperCase) missing.push('uppercase letter');
    if (!strengthInfo.hasLowerCase) missing.push('lowercase letter');
    if (!strengthInfo.hasNumeric) missing.push('number');
    if (!strengthInfo.hasSpecialChar) missing.push('special character (@$!%*?&)');
    
    return `Password must contain at least one ${missing.join(', ')}`;
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    const hasFieldError = !!(field?.errors && field.touched);
    
    // Also check for form-level password mismatch error
    if (fieldName === 'confirmPassword') {
      return hasFieldError || !!(this.registerForm.errors?.['passwordMismatch'] && field?.touched);
    }
    
    return hasFieldError;
  }

  /**
   * Get user-friendly field labels
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      phone: 'Phone number',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
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
    return 'Registration failed. Please try again.';
  }

  /**
   * Get password strength indicator
   */
  getPasswordStrength(): { score: number; label: string; color: string } {
    const password = this.registerForm.get('password')?.value || '';
    
    if (password.length === 0) {
      return { score: 0, label: '', color: '' };
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    const strengthMap = {
      0: { label: 'Very Weak', color: 'text-red-600' },
      1: { label: 'Very Weak', color: 'text-red-600' },
      2: { label: 'Weak', color: 'text-orange-600' },
      3: { label: 'Fair', color: 'text-yellow-600' },
      4: { label: 'Good', color: 'text-blue-600' },
      5: { label: 'Strong', color: 'text-green-600' }
    };

    return { score, ...strengthMap[score as keyof typeof strengthMap] };
  }
}