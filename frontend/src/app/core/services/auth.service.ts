import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'APPLICANT' | 'LOAN_OFFICER' | 'SENIOR_LOAN_OFFICER' | 'COMPLIANCE_OFFICER' | 'SENIOR_COMPLIANCE_OFFICER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'BLOCKED' | 'LOCKED';
  displayName?: string;
  hasPersonalDetails?: boolean;
  requiresPersonalDetails?: boolean;
}

export interface LoginRequest {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresAt: string;
  userId: string;
  email: string;
  role: string;
  message: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface RegistrationResponse {
  userId: string;
  email: string;
  status: string;
  role: string;
  requiresEmailVerification: boolean;
  requiresPhoneVerification: boolean;
  message: string;
  timestamp: string;
}

export interface VerificationRequest {
  email: string;
  otpCode: string;
  otpType: 'EMAIL_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
}

export interface VerificationResponse {
  message: string;
  timestamp: string;
  success: boolean;
  userId: string;
  email: string;
  status: string;
  role: string;
  requiresEmailVerification: boolean;
  requiresPhoneVerification: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Signals for reactive state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);

  // Public readonly signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed signals
  readonly userRole = computed(() => this._currentUser()?.role || null);
  readonly isApplicant = computed(() => this._currentUser()?.role === 'APPLICANT');
  readonly isLoanOfficer = computed(() => 
    this._currentUser()?.role === 'LOAN_OFFICER' || this._currentUser()?.role === 'SENIOR_LOAN_OFFICER'
  );
  readonly isComplianceOfficer = computed(() => 
    this._currentUser()?.role === 'COMPLIANCE_OFFICER' || this._currentUser()?.role === 'SENIOR_COMPLIANCE_OFFICER'
  );
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  readonly requiresEmailVerification = computed(() => this._currentUser()?.status === 'PENDING_VERIFICATION');

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored token
   */
  private initializeAuth(): void {
    const token = this.getStoredToken();
    if (token) {
      this.validateToken().subscribe({
        next: (user) => {
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
        },
        error: () => {
          this.clearAuthData();
        }
      });
    }
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);
    
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.token) {
          const user: User = {
            id: response.userId,
            email: response.email,
            role: response.role as any,
            status: 'ACTIVE' // Assuming successful login means active
          };
          this.setAuthData(response.token, response.refreshToken, user);
        }
      }),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<RegistrationResponse> {
    this._isLoading.set(true);
    
    return this.apiService.post<RegistrationResponse>('/auth/register', userData).pipe(
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Verify email with OTP
   */
  verifyEmail(email: string, otpCode: string): Observable<VerificationResponse> {
    this._isLoading.set(true);
    
    const request: VerificationRequest = {
      email,
      otpCode,
      otpType: 'EMAIL_VERIFICATION'
    };
    
    return this.apiService.post<VerificationResponse>('/auth/verify-email', request).pipe(
      tap(response => {
        if (response.success) {
          const user: User = {
            id: response.userId,
            email: response.email,
            role: response.role as any,
            status: response.status as any
          };
          // For verification, we might not get tokens, so handle accordingly
          // this.setAuthData(token, refreshToken, user);
        }
      }),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => this._isLoading.set(false))
    );
  }

  /**
   * Resend verification OTP
   */
  resendVerificationOtp(email: string): Observable<string> {
    return this.apiService.post<string>('/auth/resend-otp', { email });
  }

  /**
   * Logout user
   */
  logout(): void {
    this._isLoading.set(true);
    
    // Call logout API (optional)
    this.apiService.post('/auth/logout', {}).subscribe({
      complete: () => {
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
        this._isLoading.set(false);
      },
      error: () => {
        // Clear auth data even if API call fails
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
        this._isLoading.set(false);
      }
    });
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.post<LoginResponse>('/auth/refresh-token', { refreshToken }).pipe(
      tap(response => {
        if (response.token) {
          const user: User = {
            id: response.userId,
            email: response.email,
            role: response.role as any,
            status: 'ACTIVE'
          };
          this.setAuthData(response.token, response.refreshToken, user);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate current token
   */
  private validateToken(): Observable<User> {
    return this.apiService.get<any>('/auth/me').pipe(
      map(response => response.data),
      catchError(() => {
        this.clearAuthData();
        return throwError(() => new Error('Token validation failed'));
      })
    );
  }

  /**
   * Set authentication data
   */
  private setAuthData(token: string, refreshToken: string, user: User): void {
    localStorage.setItem(environment.auth.tokenKey, token);
    localStorage.setItem(environment.auth.refreshTokenKey, refreshToken);
    
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
    
    // Navigate based on user role and status
    this.navigateAfterLogin(user);
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(environment.auth.tokenKey);
    localStorage.removeItem(environment.auth.refreshTokenKey);
    
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Get stored token
   */
  getStoredToken(): string | null {
    return localStorage.getItem(environment.auth.tokenKey);
  }

  /**
   * Get stored refresh token
   */
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(environment.auth.refreshTokenKey);
  }

  /**
   * Navigate user after successful login
   */
  private navigateAfterLogin(user: User): void {
    if (user.status === 'PENDING_VERIFICATION') {
      this.router.navigate(['/auth/verify-email']);
      return;
    }

    // Navigate based on role
    switch (user.role) {
      case 'APPLICANT':
        if (user.requiresPersonalDetails) {
          this.router.navigate(['/applicant/profile/complete']);
        } else {
          this.router.navigate(['/applicant/dashboard']);
        }
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
        this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getStoredToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < (currentTime + environment.auth.tokenExpiryBuffer / 1000);
    } catch {
      return true;
    }
  }

  /**
   * Update current user data
   */
  updateCurrentUser(user: Partial<User>): void {
    const currentUser = this._currentUser();
    if (currentUser) {
      this._currentUser.set({ ...currentUser, ...user });
    }
  }
}