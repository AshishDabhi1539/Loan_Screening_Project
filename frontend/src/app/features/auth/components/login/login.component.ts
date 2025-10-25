import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models/auth.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  environment = environment;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Clear any existing errors when component loads
    this.authService.clearError();
    
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.authService.navigateToRoleDashboard();
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Clear error message when user starts typing
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const loginData: LoginRequest = {
        emailOrPhone: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe || false
      };

      console.log('🚀 Sending login request...');

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('✅ Login response received:', response);
          this.isLoading.set(false);
          
          console.log('🎯 Navigating to dashboard...');
          // Navigate to appropriate dashboard based on user role
          this.authService.navigateToRoleDashboard();
        },
        error: (error) => {
          console.error('❌ Login error:', error);
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || 'Login failed. Please check your credentials and try again.'
          );
          
          // Clear password field on error
          this.loginForm.patchValue({ password: '' });
        }
      });
    } else {
      console.warn('⚠️ Form is invalid:', this.loginForm.errors);
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    // Navigate to forgot password page
    this.router.navigate(['/auth/forgot-password']);
  }

  onRegister(event: Event): void {
    event.preventDefault();
    // Navigate to registration page
    this.router.navigate(['/auth/register']);
  }

  // Demo credentials for development
  fillDemoCredentials(role: string): void {
    if (!environment.production) {
      const credentials = this.getDemoCredentials(role);
      this.loginForm.patchValue({
        email: credentials.email,
        password: credentials.password,
        rememberMe: false
      });
    }
  }

  private getDemoCredentials(role: string): { email: string; password: string } {
    const demoCredentials = {
      'applicant': { email: 'applicant@demo.com', password: 'password123' },
      'loan-officer': { email: 'officer@demo.com', password: 'password123' },
      'compliance': { email: 'compliance@demo.com', password: 'password123' },
      'admin': { email: 'admin@demo.com', password: 'password123' }
    };

    return demoCredentials[role as keyof typeof demoCredentials] || demoCredentials.applicant;
  }
}
