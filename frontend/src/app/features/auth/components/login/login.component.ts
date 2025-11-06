import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models/auth.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals for reactive state
  isLoading = this.authService.isLoading;
  showPassword = signal(false);
  loginError = signal<string | null>(null);
  
  // CAPTCHA
  @ViewChild('captchaCanvas', { static: false }) captchaCanvas!: ElementRef<HTMLCanvasElement>;
  captchaText = signal<string>('');
  captchaError = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    emailOrPhone: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8)
    ]],
    captcha: ['', [Validators.required]],
    rememberMe: [false]
  });

  constructor() {
    // Check if user is already authenticated
    const user = this.authService.currentUser();
    if (user) {
      // Valid token exists, redirect to dashboard
      this.redirectToDashboardByRole(user.role);
    }
  }

  ngOnInit(): void {
    this.generateCaptcha();
  }

  ngAfterViewInit(): void {
    this.drawCaptcha();
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Generate random CAPTCHA text (6 alphanumeric characters)
   */
  generateCaptcha(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.captchaText.set(captcha);
    this.captchaError.set(null);
    this.loginForm.patchValue({ captcha: '' });
  }

  /**
   * Draw CAPTCHA with modern artistic style (lighter theme)
   */
  drawCaptcha(): void {
    if (!this.captchaCanvas) return;
    
    const canvas = this.captchaCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Light gradient background with soft colors
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#fef3f3');  // Light pink
    gradient.addColorStop(0.3, '#fef9f3'); // Light peach
    gradient.addColorStop(0.6, '#f3f9fe'); // Light blue
    gradient.addColorStop(1, '#f9f3fe');   // Light purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add artistic noise lines (lighter)
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${150 + Math.random() * 50}, ${100 + Math.random() * 100}, ${150 + Math.random() * 50}, 0.15)`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Draw CAPTCHA text with artistic style
    const captcha = this.captchaText();
    const spacing = canvas.width / (captcha.length + 1);
    
    for (let i = 0; i < captcha.length; i++) {
      // Vibrant but not too dark colors
      const colors = [
        '#e74c3c', // Red
        '#3498db', // Blue
        '#2ecc71', // Green
        '#f39c12', // Orange
        '#9b59b6', // Purple
        '#e67e22'  // Dark orange
      ];
      ctx.fillStyle = colors[i % colors.length];
      
      // Bold font with slight variation
      const fontSize = 32 + Math.random() * 4;
      ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      
      // Position with slight randomness
      const x = spacing * (i + 0.8) + (Math.random() - 0.5) * 5;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 8;
      const angle = (Math.random() - 0.5) * 0.3;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Add text shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(captcha[i], 0, 0);
      ctx.restore();
    }

    // Add light noise dots for texture
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, ${0.1 + Math.random() * 0.15})`;
      const size = 1 + Math.random() * 2;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        size,
        size
      );
    }
  }

  /**
   * Refresh CAPTCHA
   */
  refreshCaptcha(): void {
    this.generateCaptcha();
    setTimeout(() => this.drawCaptcha(), 0);
  }

  /**
   * Validate CAPTCHA
   */
  validateCaptcha(): boolean {
    const userInput = this.loginForm.get('captcha')?.value?.trim();
    const isValid = userInput === this.captchaText();
    
    if (!isValid) {
      this.captchaError.set('CAPTCHA does not match. Please try again.');
      this.refreshCaptcha();
    } else {
      this.captchaError.set(null);
    }
    
    return isValid;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      // Validate CAPTCHA first
      if (!this.validateCaptcha()) {
        this.markFormGroupTouched();
        return;
      }
      
      this.loginError.set(null);

      const loginData: LoginRequest = {
        emailOrPhone: this.loginForm.value.emailOrPhone.trim(),
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe || false
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.notificationService.loginSuccess(response.email);
          // Use response role directly for immediate redirect
          this.redirectToDashboardByRole(response.role);
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
      password: 'Password',
      captcha: 'CAPTCHA'
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
   * Redirect user to appropriate dashboard based on role from response
   */
  private redirectToDashboardByRole(role: string): void {
    switch (role) {
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
  }
}