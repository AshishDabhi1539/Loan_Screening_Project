package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for officer personal details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerPersonalDetailsResponse {
    
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String middleName;
    private String fullName;
    private String shortDisplayName;
    private String displayNameWithTitle;
    private String employeeId;
    private String department;
    private String designation;
    private String phoneNumber;
    private String workLocation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // User information
    private String email;
    private String role;
    private String userStatus;
    
    // Computed fields
    private boolean canPerformLoanOperations;
    private boolean canPerformComplianceOperations;
    private boolean hasCompleteProfile;
}
