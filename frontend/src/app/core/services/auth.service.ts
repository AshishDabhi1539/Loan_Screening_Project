import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { NotificationSseService } from './notification-sse.service';
import { InAppNotificationService } from './in-app-notification.service';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegistrationResponse,
  VerificationRequest,
  VerificationResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly sseService = inject(NotificationSseService);
  private readonly notificationService = inject(InAppNotificationService);

  // Signals for reactive state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isInitializing = signal<boolean>(true);

  // Public readonly signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isInitializing = this._isInitializing.asReadonly();

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
   * Fixed to work with server-side JWT (24h expiry, 7d refresh)
   */
  private initializeAuth(): void {
    const token = this.getStoredToken();
    
    if (token && !this.isTokenExpired()) {
      // Token exists and is valid - set authenticated immediately
      this._isAuthenticated.set(true);
      
      // Extract user info from token payload (avoid HTTP call during init)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.userId,
          email: payload.email || payload.sub,
          role: payload.role as any,
          status: 'ACTIVE' // Assume active if token is valid
        };
        this._currentUser.set(user);
      } catch (error) {
        console.error('Error extracting user from token:', error);
      }
      
      this._isInitializing.set(false);
    } else if (token) {
      // Token expired, try refresh (delay to avoid circular dependency)
      setTimeout(() => this.attemptTokenRefresh(), 100);
    } else {
      // No token, initialization complete
      this._isInitializing.set(false);
    }
  }

  /**
   * Attempt token refresh
   */
  private attemptTokenRefresh(): void {
    const refreshToken = this.getStoredRefreshToken();
    if (refreshToken) {
      this.refreshToken().subscribe({
        next: () => {
          // Refresh successful, user stays authenticated
          this._isInitializing.set(false);
        },
        error: () => {
          // Refresh failed, clear auth data
          this.clearAuthData();
          this._isInitializing.set(false);
        }
      });
    } else {
      this.clearAuthData();
      this._isInitializing.set(false);
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
            displayName: response.displayName || response.email.split('@')[0],
            role: response.role as any,
            status: 'ACTIVE'
          };
          this.setAuthData(response.token, response.refreshToken, user, credentials.rememberMe || false);
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
    
    // CRITICAL: Clear auth state IMMEDIATELY to prevent any components from making authenticated requests
    // This must happen synchronously before any async operations
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    
    // Get token before clearing storage (for API call)
    const token = this.getStoredToken();
    
    // Disconnect SSE immediately
    this.sseService.disconnect();
    
    // Clear notification state
    this.notificationService.clear();
    
    if (token) {
      // Make logout API call with token still available
      // Use HttpClient directly with text response type since backend returns plain text
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { 
        responseType: 'text',
        headers: { 'Authorization': `Bearer ${token}` }
      }).pipe(
        catchError(() => {
          // Ignore logout errors - we're logging out anyway
          return of('');
        })
      ).subscribe({
        next: () => {
          this.performLogout();
        },
        error: () => {
          // Even if API fails, still logout locally
          this.performLogout();
        }
      });
    } else {
      // No token, just clear local data
      this.performLogout();
    }
  }
  
  /**
   * Perform local logout operations
   */
  private performLogout(): void {
    // Clear storage (tokens already cleared from state above)
    localStorage.removeItem(environment.auth.tokenKey);
    localStorage.removeItem(environment.auth.refreshTokenKey);
    localStorage.removeItem(environment.auth.rememberMeKey);
    
    sessionStorage.removeItem(environment.auth.tokenKey);
    sessionStorage.removeItem(environment.auth.refreshTokenKey);
    sessionStorage.removeItem(environment.auth.rememberMeKey);
    
    // Navigate immediately (no setTimeout needed since auth state already cleared)
    this.router.navigate(['/'], { replaceUrl: true }).then(() => {
      this._isLoading.set(false);
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

    // Preserve remember me setting
    const rememberMe = this.isRememberMeEnabled();

    return this.apiService.post<LoginResponse>('/auth/refresh-token', { refreshToken }).pipe(
      tap(response => {
        if (response.token) {
          const user: User = {
            id: response.userId,
            email: response.email,
            displayName: response.displayName || response.email.split('@')[0],
            role: response.role as any,
            status: 'ACTIVE'
          };
          // Preserve remember me setting when refreshing
          this.setAuthData(response.token, response.refreshToken, user, rememberMe);
        }
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate current token with server
   */
  private validateToken(): Observable<User> {
    return this.apiService.get<any>('/auth/me').pipe(
      map(response => response.data || response),
      catchError(() => {
        return throwError(() => new Error('Token validation failed'));
      })
    );
  }

  /**
   * Set authentication data with Remember Me support
   */
  private setAuthData(token: string, refreshToken: string, user: User, rememberMe: boolean = false): void {
    // Clear old tokens from both storages first to prevent using expired tokens
    this.clearAuthData();
    
    // Use localStorage for Remember Me, sessionStorage otherwise
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(environment.auth.tokenKey, token);
    storage.setItem(environment.auth.refreshTokenKey, refreshToken);
    storage.setItem(environment.auth.rememberMeKey, rememberMe.toString());
    
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
    
    // Delay SSE connection and notification loading to ensure token is available
    setTimeout(() => {
      // Only connect if we still have a valid token (prevent using expired tokens)
      const currentToken = this.getStoredToken();
      if (currentToken === token && !this.isTokenExpired()) {
        // Connect to SSE for real-time notifications
        this.sseService.connect(token);
        
        // Load initial notification count
        this.notificationService.getUnreadCount().subscribe();
      }
    }, 100);
    
    // Only navigate after login, not during initialization
    if (!this.isInitializing()) {
      this.navigateAfterLogin(user);
    }
  }

  /**
   * Clear authentication data from both storages
   */
  private clearAuthData(): void {
    // Clear from both localStorage and sessionStorage
    localStorage.removeItem(environment.auth.tokenKey);
    localStorage.removeItem(environment.auth.refreshTokenKey);
    localStorage.removeItem(environment.auth.rememberMeKey);
    
    sessionStorage.removeItem(environment.auth.tokenKey);
    sessionStorage.removeItem(environment.auth.refreshTokenKey);
    sessionStorage.removeItem(environment.auth.rememberMeKey);
    
    // Disconnect from SSE
    this.sseService.disconnect();
    
    // Clear notification state
    this.notificationService.clear();
    
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Get stored token from either storage
   */
  getStoredToken(): string | null {
    return localStorage.getItem(environment.auth.tokenKey) || 
           sessionStorage.getItem(environment.auth.tokenKey);
  }

  /**
   * Get stored refresh token from either storage
   */
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(environment.auth.refreshTokenKey) || 
           sessionStorage.getItem(environment.auth.refreshTokenKey);
  }

  /**
   * Check if Remember Me is enabled
   */
  private isRememberMeEnabled(): boolean {
    const rememberMe = localStorage.getItem(environment.auth.rememberMeKey) || 
                       sessionStorage.getItem(environment.auth.rememberMeKey);
    return rememberMe === 'true';
  }

  /**
   * Forgot password - Send OTP to email
   */
  forgotPassword(email: string): Observable<any> {
    return this.apiService.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with OTP
   */
  resetPassword(email: string, otpCode: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.apiService.post('/auth/reset-password', {
      email,
      otpCode,
      newPassword,
      confirmPassword
    });
  }

  /**
   * Navigate user after successful login
   */
  private navigateAfterLogin(user: User): void {
    if (user.status === 'PENDING_VERIFICATION') {
      this.router.navigate(['/auth/verify-email']);
      return;
    }

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
   * Fixed to work with server JWT format (exp in seconds)
   */
  isTokenExpired(): boolean {
    const token = this.getStoredToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Server JWT exp is in seconds, add 5-minute buffer
      const bufferSeconds = 300; // 5 minutes
      
      return payload.exp <= (currentTime + bufferSeconds);
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
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
