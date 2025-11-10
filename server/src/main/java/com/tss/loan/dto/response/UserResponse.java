package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String phone;
    private String displayName;
    private RoleType role;
    // Profile completion status
    private boolean hasPersonalDetails;
    private boolean requiresPersonalDetails;
    private UserStatus status;
    private Boolean isEmailVerified;
    private Boolean isPhoneVerified;
    private Integer failedLoginAttempts;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;
    
    // Summary counts (instead of full collections - breaks circular reference)
    private int loanApplicationsCount;
    private int assignedApplicationsCount;
    
    // Business methods
    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
    
    public boolean isVerified() {
        return isEmailVerified && isPhoneVerified;
    }
}
