import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  resetPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.resetPasswordForm.patchValue({ email });
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      if (this.resetPasswordForm.value.newPassword !== this.resetPasswordForm.value.confirmPassword) {
        this.notificationService.error('Error', 'Passwords do not match');
        return;
      }

      this.isLoading.set(true);
      
      this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, this.resetPasswordForm.value)
        .subscribe({
          next: (response) => {
            this.notificationService.success('Success', response.message);
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          },
          error: (error) => {
            this.isLoading.set(false);
            const errorMessage = error?.error?.message || 'Failed to reset password. Please try again.';
            this.notificationService.error('Error', errorMessage);
          }
        });
    } else {
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.resetPasswordForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return 'Password must be at least 8 characters';
      if (field.errors['pattern']) return 'OTP must be 6 digits';
    }
    
    return null;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      otpCode: 'OTP',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[fieldName] || fieldName;
  }
}
