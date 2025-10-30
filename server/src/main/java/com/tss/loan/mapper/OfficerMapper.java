package com.tss.loan.mapper;

import org.springframework.stereotype.Component;

import com.tss.loan.dto.response.OfficerDetailsResponse;
import com.tss.loan.entity.officer.OfficerPersonalDetails;
import com.tss.loan.entity.user.User;

/**
 * Mapper for converting Officer entities to DTOs
 */
@Component
public class OfficerMapper {
    
    /**
     * Convert User and OfficerPersonalDetails to comprehensive OfficerDetailsResponse
     */
    public OfficerDetailsResponse toDetailsResponse(User user, OfficerPersonalDetails personalDetails) {
        OfficerDetailsResponse.OfficerDetailsResponseBuilder builder = OfficerDetailsResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(user.getRole().name())
            .status(user.getStatus().name())
            .isEmailVerified(user.getIsEmailVerified())
            .isPhoneVerified(user.getIsPhoneVerified())
            .failedLoginAttempts(user.getFailedLoginAttempts())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());
        
        // Add personal details if available
        if (personalDetails != null) {
            builder
                .firstName(personalDetails.getFirstName())
                .lastName(personalDetails.getLastName())
                .middleName(personalDetails.getMiddleName())
                .fullName(personalDetails.getFullName())
                .employeeId(personalDetails.getEmployeeId())
                .department(personalDetails.getDepartment())
                .designation(personalDetails.getDesignation())
                .phoneNumber(personalDetails.getPhoneNumber())
                .workLocation(personalDetails.getWorkLocation());
        }
        
        return builder.build();
    }
}
