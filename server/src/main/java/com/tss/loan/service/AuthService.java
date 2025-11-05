package com.tss.loan.service;

import com.tss.loan.dto.request.ForgotPasswordRequest;
import com.tss.loan.dto.request.OtpVerificationRequest;
import com.tss.loan.dto.request.ResetPasswordRequest;
import com.tss.loan.dto.request.UserLoginRequest;
import com.tss.loan.dto.request.UserRegistrationRequest;
import com.tss.loan.dto.response.ForgotPasswordResponse;
import com.tss.loan.dto.response.LoginResponse;
import com.tss.loan.dto.response.RegistrationResponse;
import com.tss.loan.dto.response.ResetPasswordResponse;
import com.tss.loan.dto.response.VerificationResponse;

public interface AuthService {
    RegistrationResponse register(UserRegistrationRequest request);
    LoginResponse login(UserLoginRequest request);
    VerificationResponse verifyEmailOtp(OtpVerificationRequest request);
    boolean resendEmailOtp(String email);
    void logout(String token);
    ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request);
    ResetPasswordResponse resetPassword(ResetPasswordRequest request);
}
