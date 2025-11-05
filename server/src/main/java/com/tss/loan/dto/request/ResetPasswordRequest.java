package com.tss.loan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;
    
    @NotBlank(message = "OTP code is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must contain only digits")
    private String otpCode;
    
    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    private String newPassword;
    
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
}
