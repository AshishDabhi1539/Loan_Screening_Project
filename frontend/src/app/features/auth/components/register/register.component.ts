import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.authService.clearError();
    
    if (this.authService.isAuthenticated()) {
      this.authService.navigateToRoleDashboard();
    }
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const registerData: RegisterRequest = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        phone: this.registerForm.value.phone || undefined
      };

      console.log('🚀 Sending registration request...');

      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('✅ Registration successful:', response);
          this.isLoading.set(false);
          this.successMessage.set('Registration successful! Please check your email to verify your account.');
          
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Registration error:', error);
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || 'Registration failed. Please try again.'
          );
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasPasswordMismatch(): boolean {
    const confirmPassword = this.registerForm.get('confirmPassword');
    return !!(confirmPassword && confirmPassword.touched && this.registerForm.errors?.['passwordMismatch']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}

