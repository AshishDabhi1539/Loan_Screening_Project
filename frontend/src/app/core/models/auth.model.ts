/**
 * Authentication Models
 * All authentication-related interfaces and types
 */

/**
 * User interface
 */
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

/**
 * Login request
 */
export interface LoginRequest {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresAt: string;
  userId: string;
  email: string;
  displayName?: string;  // User's full name for display
  role: string;
  message: string;
}

/**
 * Registration request
 */
export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Registration response
 */
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

/**
 * Verification request
 */
export interface VerificationRequest {
  email: string;
  otpCode: string;
  otpType: 'EMAIL_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
}

/**
 * Verification response
 */
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

