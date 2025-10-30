import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName?: string;
  hasPersonalDetails: boolean;
  requiresPersonalDetails: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface PersonalDetailsRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  panNumber: string;
  aadhaarNumber: string;
  currentAddress: AddressRequest;
  permanentAddress?: AddressRequest;
  sameAsPermanent: boolean;
}

export interface AddressRequest {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PersonalDetailsResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  maritalStatus: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  panNumber: string;
  aadhaarNumber: string;
  currentAddress: AddressResponse;
  permanentAddress?: AddressResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressResponse {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiService = inject(ApiService);

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<UserProfile> {
    console.log('🔄 Fetching user profile from:', '/applicant/profile/status');
    return this.apiService.get<any>('/applicant/profile/status').pipe(
      map(response => {
        console.log('✅ Profile API response:', response);
        return this.transformUserProfile(response);
      }),
      catchError(error => {
        console.error('❌ Profile API error:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        throw error;
      })
    );
  }

  /**
   * Check if user has completed personal details
   */
  hasPersonalDetails(): Observable<boolean> {
    return this.apiService.get<any>('/applicant/profile/status').pipe(
      map(response => response.hasPersonalDetails || false),
      catchError(error => {
        console.error('Failed to check personal details status:', error);
        return of(false);
      })
    );
  }

  /**
   * Get user's personal details
   */
  getPersonalDetails(): Observable<PersonalDetailsResponse> {
    return this.apiService.get<PersonalDetailsResponse>('/applicant/profile/personal-details').pipe(
      catchError(error => {
        console.error('Failed to get personal details:', error);
        throw error;
      })
    );
  }

  /**
   * Create or update personal details
   */
  savePersonalDetails(details: PersonalDetailsRequest): Observable<PersonalDetailsResponse> {
    return this.apiService.post<PersonalDetailsResponse>('/applicant/profile/personal-details', details).pipe(
      catchError(error => {
        console.error('Failed to save personal details:', error);
        throw error;
      })
    );
  }

  /**
   * Update user profile (email, phone, etc.)
   */
  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.apiService.put<any>('/auth/profile', profileData).pipe(
      map(response => this.transformUserProfile(response)),
      catchError(error => {
        console.error('Failed to update profile:', error);
        throw error;
      })
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.apiService.post<void>('/auth/change-password', {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => {
        console.error('Failed to change password:', error);
        throw error;
      })
    );
  }

  /**
   * Get profile completion status
   */
  getProfileCompletionStatus(): Observable<{
    hasPersonalDetails: boolean;
    canApplyForLoan: boolean;
    completionPercentage: number;
    missingFields: string[];
  }> {
    return this.apiService.get<any>('/applicant/profile/status').pipe(
      map(response => ({
        hasPersonalDetails: response.hasPersonalDetails || false,
        canApplyForLoan: response.canApplyForLoan || false,
        completionPercentage: response.completionPercentage || 0,
        missingFields: response.missingFields || []
      })),
      catchError(error => {
        console.error('Failed to get profile completion status:', error);
        return of({
          hasPersonalDetails: false,
          canApplyForLoan: false,
          completionPercentage: 0,
          missingFields: ['personal_details']
        });
      })
    );
  }

  /**
   * Transform backend user response to frontend format
   */
  private transformUserProfile(response: any): UserProfile {
    // The profile-status endpoint returns a different structure
    return {
      id: 'current-user', // We don't get user ID from profile-status
      email: 'current-user@example.com', // We don't get email from profile-status
      role: 'APPLICANT', // Assume applicant role
      status: 'ACTIVE', // Assume active if we can call the API
      displayName: 'User', // Default display name
      hasPersonalDetails: response.hasPersonalDetails || false,
      requiresPersonalDetails: !response.hasPersonalDetails,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
  }

  /**
   * Get user display name with fallback
   */
  getDisplayName(user?: UserProfile): string {
    if (!user) return 'User';
    return user.displayName || user.email?.split('@')[0] || 'User';
  }

  /**
   * Check if user can apply for loan
   */
  canUserApplyForLoan(user?: UserProfile): boolean {
    if (!user) return false;
    return user.status === 'ACTIVE' && user.hasPersonalDetails;
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(user?: UserProfile): number {
    if (!user) return 0;
    
    let completion = 0;
    
    // Basic account setup (40%)
    if (user.status === 'ACTIVE') completion += 40;
    
    // Personal details (60%)
    if (user.hasPersonalDetails) completion += 60;
    
    return Math.min(completion, 100);
  }

  /**
   * Get next steps for profile completion
   */
  getNextSteps(user?: UserProfile): string[] {
    if (!user) return ['Complete registration'];
    
    const steps: string[] = [];
    
    if (user.status !== 'ACTIVE') {
      steps.push('Verify your email address');
    }
    
    if (!user.hasPersonalDetails) {
      steps.push('Complete personal details');
    }
    
    if (steps.length === 0) {
      steps.push('Your profile is complete!');
    }
    
    return steps;
  }

  /**
   * Validate PAN number format
   */
  isValidPAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }

  /**
   * Validate Aadhaar number format
   */
  isValidAadhaar(aadhaar: string): boolean {
    const aadhaarRegex = /^[0-9]{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  /**
   * Format PAN number for display
   */
  formatPAN(pan: string): string {
    return pan.toUpperCase();
  }

  /**
   * Format Aadhaar number for display (masked)
   */
  formatAadhaar(aadhaar: string, masked: boolean = true): string {
    const cleaned = aadhaar.replace(/\s/g, '');
    if (cleaned.length === 12) {
      if (masked) {
        return `XXXX-XXXX-${cleaned.slice(8)}`;
      } else {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
      }
    }
    return aadhaar;
  }

  /**
   * Save personal details using new backend structure
   */
  savePersonalDetailsNew(personalDetails: any): Observable<any> {
    console.log('Saving personal details to backend:', personalDetails);
    
    return this.apiService.post('/applicant/profile/personal-details', personalDetails).pipe(
      map((response: any) => {
        console.log('Personal details saved successfully:', response);
        return response;
      }),
      catchError(error => {
        console.error('Failed to save personal details:', error);
        throw error;
      })
    );
  }
}
