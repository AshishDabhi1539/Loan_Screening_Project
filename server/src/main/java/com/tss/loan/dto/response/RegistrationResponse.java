package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registration Response DTO
 * 
 * Purpose: Response after successful user registration
 * Contains: Essential user info + verification requirements
 * Security: No sensitive data (password, tokens, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponse {
    private UUID userId;
    private String email;
    private String status;           // PENDING (until email verified)
    private String role;             // APPLICANT (default for registration)
    private boolean requiresEmailVerification;    // true - must verify email
    private boolean requiresPhoneVerification;    // false - phone auto-verified
    private String message;
    private LocalDateTime timestamp;
}
