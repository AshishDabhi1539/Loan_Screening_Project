package com.tss.loan.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tss.loan.dto.response.UserResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.service.ProfileCompletionService;

@Component
public class UserMapper {
    
    @Autowired
    private ProfileCompletionService profileCompletionService;
    
    public UserResponse toResponse(User entity) {
        if (entity == null) {
            return null;
        }
        
        return UserResponse.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .displayName(profileCompletionService.getDisplayName(entity))
                .role(entity.getRole())
                .status(entity.getStatus())
                .isEmailVerified(entity.getIsEmailVerified())
                .isPhoneVerified(entity.getIsPhoneVerified())
                .failedLoginAttempts(entity.getFailedLoginAttempts())
                .lastLoginAt(entity.getLastLoginAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .version(entity.getVersion())
                
                // Summary counts (NO circular reference)
                .loanApplicationsCount(entity.getLoanApplications() != null ? entity.getLoanApplications().size() : 0)
                .assignedApplicationsCount(entity.getAssignedApplications() != null ? entity.getAssignedApplications().size() : 0)
                
                // Profile completion status
                .hasPersonalDetails(profileCompletionService.hasPersonalDetails(entity))
                .requiresPersonalDetails(!profileCompletionService.hasPersonalDetails(entity))
                .build();
    }
}
