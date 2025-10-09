package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {
    private String message;
    private LocalDateTime timestamp;
    private boolean success;
    
    // Enhanced fields for comprehensive response
    private UUID userId;
    private String email;
    private String status;
    private String role;
    private boolean requiresEmailVerification;
    private boolean requiresPhoneVerification;
}
