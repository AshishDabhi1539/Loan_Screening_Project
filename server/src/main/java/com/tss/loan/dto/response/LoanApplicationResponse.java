package com.tss.loan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.DecisionType;
import com.tss.loan.entity.enums.LoanType;
import com.tss.loan.entity.enums.RiskLevel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplicationResponse {
    private UUID id;
    private String applicantName;
    private String applicantEmail;
    private String applicantPhone;
    private LoanType loanType;
    private BigDecimal requestedAmount;
    private Integer tenureMonths;
    private String purpose;
    private Boolean existingLoans;
    private BigDecimal existingEmi;
    private ApplicationStatus status;
    private RiskLevel riskLevel;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime finalDecisionAt;
    private String remarks;
    
    // Decision fields
    private DecisionType decisionType;
    private BigDecimal approvedAmount;
    private BigDecimal approvedInterestRate;
    private Integer approvedTenureMonths;
    private String decisionReason;
    private LocalDateTime decidedAt;
    
    // Risk scoring
    private Integer riskScore;
    private Integer fraudScore;
    private String fraudReasons;
    
    // Applicant info (NOT full User entity - breaks circular reference)
    private UUID applicantId;
    
    // Officer info (NOT full User entity - breaks circular reference)
    private UUID assignedOfficerId;
    private String assignedOfficerName;
    private UUID decidedById;
    private String decidedByName;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;
    
    // Counts (instead of full collections)
    private int documentsCount;
    private int fraudCheckResultsCount;
    
    // Status flags
    private boolean hasPersonalDetails;
    private boolean hasFinancialProfile;
    
    // Employment type for routing
    private String employmentType;
}
