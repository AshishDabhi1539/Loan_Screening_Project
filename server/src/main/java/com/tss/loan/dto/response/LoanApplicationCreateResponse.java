package com.tss.loan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplicationCreateResponse {
    private UUID id;
    private String loanType;
    private BigDecimal requestedAmount;
    private Integer tenureMonths;
    private String status;
    private String message;
    private LocalDateTime createdAt;
    private String nextStep;
    private String nextStepUrl;
}
