package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for officer personal details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfficerPersonalDetailsRequest {
    
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;
    
    @Size(max = 50, message = "Middle name cannot exceed 50 characters")
    private String middleName;
    
    // Employee ID is auto-generated, not provided in request
    
    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;
    
    @Size(max = 100, message = "Designation cannot exceed 100 characters")
    private String designation;
    
    @Size(max = 15, message = "Phone number cannot exceed 15 characters")
    private String phoneNumber;
    
    @Size(max = 200, message = "Work location cannot exceed 200 characters")
    private String workLocation;
}
