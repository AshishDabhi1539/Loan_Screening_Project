import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);
  emailSent = signal(false);

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      
      this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, this.forgotPasswordForm.value)
        .subscribe({
          next: (response) => {
            this.emailSent.set(true);
            this.notificationService.success('Success', response.message);
            
            // Navigate to reset password page after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/auth/reset-password'], {
                queryParams: { email: this.forgotPasswordForm.value.email }
              });
            }, 2000);
          },
          error: (error) => {
            this.isLoading.set(false);
            const errorMessage = error?.error?.message || 'Failed to send reset email. Please try again.';
            this.notificationService.error('Error', errorMessage);
          }
        });
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.forgotPasswordForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Email is required';
      if (field.errors['email']) return 'Please enter a valid email address';
    }
    
    return null;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
