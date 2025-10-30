package com.tss.loan.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.IncomeType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantFinancialDetailsRequest {
    
    // Employment Details
    @NotNull(message = "Employment type is required")
    private EmploymentType employmentType;
    
    @NotBlank(message = "Company name is required")
    private String companyName;
    
    @NotBlank(message = "Job title is required")
    private String jobTitle;
    
    @NotNull(message = "Employment start date is required")
    private LocalDate employmentStartDate;
    
    @NotBlank(message = "Company address is required")
    private String companyAddress;
    
    @NotBlank(message = "Company city is required")
    private String companyCity;
    
    @NotBlank(message = "Company state is required")
    private String companyState;
    
    @NotBlank(message = "Company pincode is required")
    private String companyPincode;
    
    // Company Contact Details
    private String workPhone;
    private String workEmail;
    private String hrPhone;
    private String hrEmail;
    private String managerName;
    private String managerPhone;
    
    // Income Details
    @NotNull(message = "Income type is required")
    private IncomeType incomeType;
    
    @NotNull(message = "Monthly income is required")
    @DecimalMin(value = "10000.0", message = "Minimum monthly income is ₹10,000")
    private BigDecimal monthlyIncome;
    
    private BigDecimal additionalIncome = BigDecimal.ZERO;
    
    // Financial Profile
    @NotNull(message = "Existing loan EMI is required")
    @DecimalMin(value = "0.0", message = "EMI cannot be negative")
    private BigDecimal existingLoanEmi = BigDecimal.ZERO;
    
    @NotNull(message = "Credit card outstanding is required")
    @DecimalMin(value = "0.0", message = "Outstanding cannot be negative")
    private BigDecimal creditCardOutstanding = BigDecimal.ZERO;
    
    @NotNull(message = "Monthly expenses are required")
    @DecimalMin(value = "0.0", message = "Expenses cannot be negative")
    private BigDecimal monthlyExpenses;
    
    @NotNull(message = "Bank account balance is required")
    @DecimalMin(value = "0.0", message = "Balance cannot be negative")
    private BigDecimal bankAccountBalance;
    
    // Banking Details
    @NotBlank(message = "Bank name is required")
    private String bankName;
    
    @NotBlank(message = "Account number is required")
    private String accountNumber;
    
    @NotBlank(message = "IFSC code is required")
    private String ifscCode;
    
    @NotBlank(message = "Account type is required")
    private String accountType;
    
    @NotBlank(message = "Branch name is required")
    private String branchName;
    
    // ========== EMPLOYMENT TYPE SPECIFIC DETAILS ==========
    // Only ONE of these should be populated based on employmentType
    
    @Valid
    private ProfessionalEmploymentDetailsRequest professionalDetails;
    
    @Valid
    private FreelancerEmploymentDetailsRequest freelancerDetails;
    
    @Valid
    private RetiredEmploymentDetailsRequest retiredDetails;
    
    @Valid
    private StudentEmploymentDetailsRequest studentDetails;
}
