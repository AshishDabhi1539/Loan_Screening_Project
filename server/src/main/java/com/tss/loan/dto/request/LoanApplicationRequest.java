package com.tss.loan.dto.request;

import java.math.BigDecimal;

import com.tss.loan.entity.enums.LoanType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplicationRequest {
    
    @NotNull(message = "Loan type is required")
    private LoanType loanType;
    
    @NotNull(message = "Loan amount is required")
    @DecimalMin(value = "10000.0", message = "Minimum loan amount is ₹10,000")
    private BigDecimal loanAmount;
    
    @NotNull(message = "Loan tenure is required")
    @Positive(message = "Loan tenure must be positive")
    private Integer tenureMonths;
    
    @NotBlank(message = "Purpose is required")
    private String purpose;
    
    private String additionalNotes;
}
