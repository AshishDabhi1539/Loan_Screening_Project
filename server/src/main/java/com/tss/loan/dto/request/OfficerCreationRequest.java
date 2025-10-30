 package com.tss.loan.dto.request;

import com.tss.loan.entity.enums.RoleType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OfficerCreationRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", 
             message = "Please provide a valid email format")
    private String email;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+91|91|0)?[6-9]\\d{9}$", 
             message = "Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9")
    @Size(min = 10, max = 13, message = "Phone number must be between 10-13 digits")
    private String phone;
    
    @NotNull(message = "Role is required")
    private RoleType role; // Only LOAN_OFFICER or COMPLIANCE_OFFICER allowed
    
    @NotBlank(message = "Temporary password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;
    
    // Officer Personal Details - Required for immediate profile creation
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;
    
    @Size(max = 50, message = "Middle name cannot exceed 50 characters")
    private String middleName;
    
    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;
    
    @Size(max = 100, message = "Designation cannot exceed 100 characters")
    private String designation;
    
    @Size(max = 15, message = "Phone number cannot exceed 15 characters")
    private String phoneNumber;
    
    @Size(max = 200, message = "Work location cannot exceed 200 characters")
    private String workLocation;
    
    // Validation method
    public boolean isValidRole() {
        return role == RoleType.LOAN_OFFICER || role == RoleType.COMPLIANCE_OFFICER;
    }
}
