export interface LoginRequest {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  type?: string;
  expiresAt?: string;
  userId: string;
  email: string;
  role: string;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  status: string;
  role: string;
  requiresEmailVerification: boolean;
  requiresPhoneVerification: boolean;
  message: string;
  timestamp: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  timestamp: string;
  success: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  timestamp: string;
  success: boolean;
}

export interface OtpVerificationRequest {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface OtpVerificationResponse {
  message: string;
  timestamp: string;
  success: boolean;
  verified: boolean;
}

export interface ResendOtpRequest {
  email: string;
  purpose: OtpPurpose;
}

export interface ResendOtpResponse {
  message: string;
  timestamp: string;
  success: boolean;
  otpSent: boolean;
}

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH'
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat: number; // issued at
  exp: number; // expiration
}
