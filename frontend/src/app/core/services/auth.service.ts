import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthState,
  TokenPayload
} from '../models/auth.model';
import { User, UserRole } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'loan_app_token';
  private readonly REFRESH_TOKEN_KEY = 'loan_app_refresh_token';
  private readonly USER_KEY = 'loan_app_user';

  // Angular Signals for reactive state management
  private _isAuthenticated = signal<boolean>(false);
  private _currentUser = signal<User | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly userRole = computed(() => this.currentUser()?.role);
  readonly isApplicant = computed(() => this.userRole() === UserRole.APPLICANT);
  readonly isLoanOfficer = computed(() => 
    this.userRole() === UserRole.LOAN_OFFICER || 
    this.userRole() === UserRole.SENIOR_LOAN_OFFICER
  );
  readonly isComplianceOfficer = computed(() => 
    this.userRole() === UserRole.COMPLIANCE_OFFICER || 
    this.userRole() === UserRole.SENIOR_COMPLIANCE_OFFICER
  );
  readonly isAdmin = computed(() => this.userRole() === UserRole.ADMIN);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired(token)) {
      this._isAuthenticated.set(true);
      this._currentUser.set(user);
    } else {
      // Clear any stale auth state but do NOT navigate to login here.
      // Navigating on initialization prevents public routes (like the landing page)
      // from being accessible when the user is unauthenticated.
      this.clearTokens();
      this.clearUser();
      this._isAuthenticated.set(false);
      this._currentUser.set(null);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(loginResponse => {
          console.log('✅ Login successful!', loginResponse);
          
          // Store tokens
          this.setToken(loginResponse.token);
          this.setRefreshToken(loginResponse.refreshToken);
          
          // Create user object from flat response
          const user = {
            id: loginResponse.userId,
            email: loginResponse.email,
            role: loginResponse.role,
            status: 'ACTIVE',
            displayName: loginResponse.email.split('@')[0],
            hasPersonalDetails: false,
            requiresPersonalDetails: true
          };
          
          console.log('👤 User object created:', user);
          
          this.setUser(user);
          this._isAuthenticated.set(true);
          this._currentUser.set(user as User);
          this._loading.set(false);
          
          console.log('🔐 Authentication state updated');
        }),
        catchError(error => {
          console.error('❌ Login failed:', error);
          this._loading.set(false);
          this._error.set(error.error?.message || 'Login failed');
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(() => {
          this._loading.set(false);
        }),
        catchError(error => {
          this._loading.set(false);
          this._error.set(error.error?.message || 'Registration failed');
          return throwError(() => error);
        })
      );
  }

  verifyEmail(verificationData: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<VerifyEmailResponse>(`${this.API_URL}/verify-email`, verificationData)
      .pipe(
        tap(() => {
          this._loading.set(false);
        }),
        catchError(error => {
          this._loading.set(false);
          this._error.set(error.error?.message || 'Email verification failed');
          return throwError(() => error);
        })
      );
  }

  forgotPassword(email: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ForgotPasswordResponse>(`${this.API_URL}/forgot-password`, email)
      .pipe(
        tap(() => {
          this._loading.set(false);
        }),
        catchError(error => {
          this._loading.set(false);
          this._error.set(error.error?.message || 'Password reset request failed');
          return throwError(() => error);
        })
      );
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ResetPasswordResponse>(`${this.API_URL}/reset-password`, resetData)
      .pipe(
        tap(() => {
          this._loading.set(false);
        }),
        catchError(error => {
          this._loading.set(false);
          this._error.set(error.error?.message || 'Password reset failed');
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout the current user.
   * @param redirect Whether to navigate to the login screen (default: true)
   */
  logout(redirect: boolean = true): void {
    this.clearTokens();
    this.clearUser();
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._error.set(null);
    if (redirect) {
      this.router.navigate(['/auth/login']);
    }
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(`${this.API_URL}/refresh-token`, { refreshToken })
      .pipe(
        tap(loginResponse => {
          this.setToken(loginResponse.token);
          this.setRefreshToken(loginResponse.refreshToken);
          
          // Create user object from flat response
          const user = {
            id: loginResponse.userId,
            email: loginResponse.email,
            role: loginResponse.role,
            status: 'ACTIVE',
            displayName: loginResponse.email.split('@')[0],
            hasPersonalDetails: false,
            requiresPersonalDetails: true
          };
          
          this.setUser(user);
          this._currentUser.set(user as User);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // User management
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Token validation
  private isTokenExpired(token: string): boolean {
    try {
      const payload: TokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Role-based access control
  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }

  // Navigation helpers
  navigateToRoleDashboard(): void {
    const role = this.userRole();
    console.log('🧭 Navigating based on role:', role);
    
    switch (role) {
      case UserRole.APPLICANT:
        console.log('➡️ Redirecting to Applicant Dashboard');
        this.router.navigate(['/applicant/dashboard']);
        break;
      case UserRole.LOAN_OFFICER:
      case UserRole.SENIOR_LOAN_OFFICER:
        console.log('➡️ Redirecting to Loan Officer Dashboard');
        this.router.navigate(['/loan-officer/dashboard']);
        break;
      case UserRole.COMPLIANCE_OFFICER:
      case UserRole.SENIOR_COMPLIANCE_OFFICER:
        console.log('➡️ Redirecting to Compliance Officer Dashboard');
        this.router.navigate(['/compliance-officer/dashboard']);
        break;
      case UserRole.ADMIN:
        console.log('➡️ Redirecting to Admin Dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        console.warn('⚠️ Unknown role, redirecting to login:', role);
        this.router.navigate(['/auth/login']);
    }
  }

  // Clear error
  clearError(): void {
    this._error.set(null);
  }
}
