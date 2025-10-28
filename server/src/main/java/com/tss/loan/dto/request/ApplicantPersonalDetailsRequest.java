package com.tss.loan.dto.request;

import java.time.LocalDate;

import com.tss.loan.entity.enums.Gender;
import com.tss.loan.entity.enums.MaritalStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantPersonalDetailsRequest {
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    private String middleName; // Optional
    
    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
    
    @NotNull(message = "Gender is required")
    private Gender gender;
    
    @NotNull(message = "Marital status is required")
    private MaritalStatus maritalStatus;
    
    @NotBlank(message = "Father's name is required")
    private String fatherName;
    
    @NotBlank(message = "Mother's name is required")
    private String motherName;
    
    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "[A-Z]{5}[0-9]{4}[A-Z]{1}", message = "Invalid PAN format")
    private String panNumber;
    
    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "\\d{12}", message = "Aadhaar must be 12 digits")
    private String aadhaarNumber;
    
    // Current Address
    @NotBlank(message = "Current address line 1 is required")
    private String currentAddressLine1;
    
    private String currentAddressLine2;
    
    @NotBlank(message = "Current city is required")
    private String currentCity;
    
    @NotBlank(message = "Current state is required")
    private String currentState;
    
    @NotBlank(message = "Current pincode is required")
    @Pattern(regexp = "\\d{6}", message = "Pincode must be 6 digits")
    private String currentPincode;
    
    // Permanent Address
    private boolean sameAsCurrent = false;
    
    private String permanentAddressLine1;
    private String permanentAddressLine2;
    private String permanentCity;
    private String permanentState;
    private String permanentPincode;
}
