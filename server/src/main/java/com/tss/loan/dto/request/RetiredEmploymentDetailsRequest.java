package com.tss.loan.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Retired Employment Details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetiredEmploymentDetailsRequest {
    
    @NotBlank(message = "Pension type is required")
    @Size(max = 50, message = "Pension type must not exceed 50 characters")
    private String pensionType; // GOVERNMENT, PRIVATE, PPF, MILITARY, OTHER
    
    @NotBlank(message = "Pension provider is required")
    @Size(max = 200, message = "Pension provider must not exceed 200 characters")
    private String pensionProvider;
    
    @Size(max = 100, message = "PPO number must not exceed 100 characters")
    private String ppoNumber;
    
    @NotNull(message = "Monthly pension amount is required")
    private BigDecimal monthlyPensionAmount;
    
    @NotNull(message = "Retirement date is required")
    private LocalDate retirementDate;
    
    @NotBlank(message = "Previous employer is required")
    @Size(max = 200, message = "Previous employer must not exceed 200 characters")
    private String previousEmployer;
    
    @NotBlank(message = "Previous designation is required")
    @Size(max = 100, message = "Previous designation must not exceed 100 characters")
    private String previousDesignation;
    
    private Integer yearsOfService;
    
    @Size(max = 50, message = "Pension account number must not exceed 50 characters")
    private String pensionAccountNumber;
    
    @Size(max = 150, message = "Pension bank name must not exceed 150 characters")
    private String pensionBankName;
    
    private String additionalRetirementBenefits;
    
    private BigDecimal gratuityAmount;
}
