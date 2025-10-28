package com.tss.loan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerificationRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;
    
    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be a 6-digit number")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    private String otpCode;
    
    @NotBlank(message = "OTP type is required")
    @Size(max = 50, message = "OTP type must not exceed 50 characters")
    @Pattern(regexp = "^(EMAIL_VERIFICATION|LOGIN_2FA|PASSWORD_RESET)$", 
             message = "Invalid OTP type. Allowed values: EMAIL_VERIFICATION, LOGIN_2FA, PASSWORD_RESET")
    private String otpType;
}
