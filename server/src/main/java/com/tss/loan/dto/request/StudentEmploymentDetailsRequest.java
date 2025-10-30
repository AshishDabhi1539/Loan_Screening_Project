package com.tss.loan.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Student Employment Details
 * Includes guardian/co-applicant information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentEmploymentDetailsRequest {
    
    // ========== EDUCATION DETAILS ==========
    @NotBlank(message = "Institution name is required")
    @Size(max = 200, message = "Institution name must not exceed 200 characters")
    private String institutionName;
    
    @Size(max = 200, message = "Institution address must not exceed 200 characters")
    private String institutionAddress;
    
    @Size(max = 100, message = "Institution city must not exceed 100 characters")
    private String institutionCity;
    
    @Size(max = 50, message = "Institution state must not exceed 50 characters")
    private String institutionState;
    
    @NotBlank(message = "Course name is required")
    @Size(max = 150, message = "Course name must not exceed 150 characters")
    private String courseName;
    
    @Size(max = 100, message = "Specialization must not exceed 100 characters")
    private String specialization;
    
    @NotNull(message = "Year of study is required")
    private Integer yearOfStudy;
    
    @NotNull(message = "Total course duration is required")
    private Integer totalCourseDuration;
    
    @NotNull(message = "Expected graduation year is required")
    private Integer expectedGraduationYear;
    
    @Size(max = 50, message = "Student ID must not exceed 50 characters")
    private String studentIdNumber;
    
    private BigDecimal currentCGPA;
    
    // ========== GUARDIAN DETAILS ==========
    @NotBlank(message = "Guardian name is required")
    @Size(max = 150, message = "Guardian name must not exceed 150 characters")
    private String guardianName;
    
    @NotBlank(message = "Guardian relation is required")
    @Size(max = 50, message = "Guardian relation must not exceed 50 characters")
    private String guardianRelation; // FATHER, MOTHER, LEGAL_GUARDIAN, SPOUSE
    
    @NotBlank(message = "Guardian occupation is required")
    @Size(max = 150, message = "Guardian occupation must not exceed 150 characters")
    private String guardianOccupation;
    
    @NotBlank(message = "Guardian employer is required")
    @Size(max = 200, message = "Guardian employer must not exceed 200 characters")
    private String guardianEmployer;
    
    @Size(max = 100, message = "Guardian designation must not exceed 100 characters")
    private String guardianDesignation;
    
    @NotNull(message = "Guardian monthly income is required")
    private BigDecimal guardianMonthlyIncome;
    
    private BigDecimal guardianAnnualIncome;
    
    @NotBlank(message = "Guardian contact is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Guardian contact must be a valid 10-digit mobile number")
    private String guardianContact;
    
    @Size(max = 150, message = "Guardian email must not exceed 150 characters")
    private String guardianEmail;
    
    @Size(max = 200, message = "Guardian address must not exceed 200 characters")
    private String guardianAddress;
    
    @Size(max = 100, message = "Guardian city must not exceed 100 characters")
    private String guardianCity;
    
    @Size(max = 50, message = "Guardian state must not exceed 50 characters")
    private String guardianState;
    
    @Pattern(regexp = "^[0-9]{6}$", message = "Guardian pincode must be a valid 6-digit number")
    private String guardianPincode;
    
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Guardian PAN must be valid (e.g., ABCDE1234F)")
    private String guardianPanNumber;
    
    @Pattern(regexp = "^[0-9]{12}$", message = "Guardian Aadhar must be a valid 12-digit number")
    private String guardianAadharNumber;
    
    // ========== FINANCIAL SUPPORT ==========
    private BigDecimal scholarshipAmount;
    
    @Size(max = 200, message = "Scholarship provider must not exceed 200 characters")
    private String scholarshipProvider;
    
    private BigDecimal familySavingsForEducation;
    
    private String additionalFinancialSupport;
}
