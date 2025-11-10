import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';
import { OfficerCreationRequest } from '../../../../core/models/admin.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-create-officer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-officer.component.html',
  styleUrl: './create-officer.component.css'
})
export class CreateOfficerComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Form state
  isLoading = signal(false);
  isSubmitted = signal(false);

  // Officer roles based on your backend (only LOAN_OFFICER and COMPLIANCE_OFFICER allowed)
  officerRoles = [
    { value: 'LOAN_OFFICER', label: 'Loan Officer', description: 'Processes loan applications and reviews documents' },
    { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', description: 'Reviews flagged applications for compliance' }
  ];

  // Create officer form matching your backend DTO exactly
  createOfficerForm: FormGroup = this.fb.group({
    // Required fields
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.pattern(/^(\+91|91|0)?[6-9]\d{9}$/), Validators.minLength(10), Validators.maxLength(13)]],
    role: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    
    // Optional fields
    middleName: ['', [Validators.maxLength(50)]],
    department: ['', [Validators.maxLength(100)]],
    designation: ['', [Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.maxLength(15)]],
    workLocation: ['', [Validators.maxLength(200)]]
  });

  /**
   * Get form control for easy access in template
   */
  get f() {
    return this.createOfficerForm.controls;
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.createOfficerForm.get(fieldName);
    if (!field) return false;
    
    const hasError = errorType ? field.hasError(errorType) : field.invalid;
    return hasError && (field.dirty || field.touched || this.isSubmitted());
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.createOfficerForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    
    return 'Invalid input';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      phone: 'Phone Number',
      role: 'Role',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
      department: 'Department',
      designation: 'Designation',
      phoneNumber: 'Alternative Phone',
      workLocation: 'Work Location'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.createOfficerForm.invalid) {
      this.notificationService.error('Form Error', 'Please fix the errors below and try again.');
      return;
    }

    this.isLoading.set(true);
    
    const formValue = this.createOfficerForm.value;
    const request: OfficerCreationRequest = {
      email: formValue.email,
      phone: formValue.phone,
      role: formValue.role,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      middleName: formValue.middleName || undefined,
      department: formValue.department || undefined,
      designation: formValue.designation || undefined,
      phoneNumber: formValue.phoneNumber || undefined,
      workLocation: formValue.workLocation || undefined
    };

    console.log('🚀 Creating officer with data:', request);

    this.adminService.createOfficer(request).subscribe({
      next: (response) => {
        console.log('✅ Officer created successfully:', response);
        this.isLoading.set(false);
        
        // Your backend returns a plain string message
        const successMessage = typeof response === 'string' ? response : `Officer created successfully! Credentials sent to ${request.email}`;
        this.notificationService.success('Success', successMessage);
        
        // Reset form
        this.createOfficerForm.reset();
        this.isSubmitted.set(false);
        
        // Navigate back to dashboard after a short delay to show the success message
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error creating officer:', error);
        this.isLoading.set(false);
        
        let errorMessage = 'Failed to create officer. Please try again.';
        
        // Handle different error response formats
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Reset form
   */
  onReset(): void {
    this.createOfficerForm.reset();
    this.isSubmitted.set(false);
    this.notificationService.info('Form Reset', 'Form has been reset to default values.');
  }
}
