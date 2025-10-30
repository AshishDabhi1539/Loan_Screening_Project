package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Professional Employment Details
 * For Doctors, Lawyers, CAs, Architects, Engineers, Consultants
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalEmploymentDetailsRequest {
    
    @NotBlank(message = "Profession type is required")
    @Size(max = 50, message = "Profession type must not exceed 50 characters")
    private String professionType; // DOCTOR, LAWYER, CHARTERED_ACCOUNTANT, ARCHITECT, ENGINEER, CONSULTANT, OTHER
    
    @NotBlank(message = "Registration number is required")
    @Size(max = 100, message = "Registration number must not exceed 100 characters")
    private String registrationNumber;
    
    @NotBlank(message = "Registration authority is required")
    @Size(max = 200, message = "Registration authority must not exceed 200 characters")
    private String registrationAuthority;
    
    @NotBlank(message = "Professional qualification is required")
    @Size(max = 150, message = "Professional qualification must not exceed 150 characters")
    private String professionalQualification;
    
    @Size(max = 200, message = "University name must not exceed 200 characters")
    private String university;
    
    private Integer yearOfQualification;
    
    @Size(max = 200, message = "Practice area must not exceed 200 characters")
    private String practiceArea;
    
    @Size(max = 150, message = "Clinic/Firm name must not exceed 150 characters")
    private String clinicOrFirmName;
    
    @Size(max = 200, message = "Clinic/Firm address must not exceed 200 characters")
    private String clinicOrFirmAddress;
    
    private String additionalCertifications;
}
