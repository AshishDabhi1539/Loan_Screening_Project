package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserLoginRequest {
    
    @NotBlank(message = "Email or phone is required")
    @Size(max = 150, message = "Email or phone must not exceed 150 characters")
    private String emailOrPhone;
    
    @NotBlank(message = "Password is required")
    @Size(min = 1, max = 100, message = "Password length is invalid")
    private String password;
}
