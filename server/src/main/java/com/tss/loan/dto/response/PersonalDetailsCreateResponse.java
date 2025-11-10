package com.tss.loan.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDetailsCreateResponse {
    // Status fields
    private String message;
    private boolean canApplyForLoan;
    private String nextAction;
    private String nextActionUrl;
    private LocalDateTime updatedAt;
    
    // Personal Details fields
    private String firstName;
    private String lastName;
    private String middleName;
    private LocalDate dateOfBirth;
    private String gender;
    private String maritalStatus;
    private String fatherName;
    private String motherName;
    private String panNumber;
    private String aadhaarNumber;
    
    // Current Address
    private String currentAddressLine1;
    private String currentAddressLine2;
    private String currentCity;
    private String currentState;
    private String currentPincode;
    
    // Permanent Address
    private boolean sameAsCurrent;
    private String permanentAddressLine1;
    private String permanentAddressLine2;
    private String permanentCity;
    private String permanentState;
    private String permanentPincode;
    
    // Optional fields
    private String alternatePhoneNumber;
    private Integer dependentsCount;
    private String spouseName;
}
