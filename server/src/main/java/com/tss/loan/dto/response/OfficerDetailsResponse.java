package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Comprehensive DTO for officer details including personal information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerDetailsResponse {
    
    // User Account Information
    private UUID id;
    private String email;
    private String phone;
    private String role;
    private String status;
    private Boolean isEmailVerified;
    private Boolean isPhoneVerified;
    private Integer failedLoginAttempts;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Officer Personal Details
    private String firstName;
    private String lastName;
    private String middleName;
    private String fullName;
    private String employeeId;
    private String department;
    private String designation;
    private String phoneNumber;
    private String workLocation;
    
    // Statistics (optional - can be populated later)
    private Long totalAssignedApplications;
    private Long activeApplications;
    private Long completedApplications;
}
