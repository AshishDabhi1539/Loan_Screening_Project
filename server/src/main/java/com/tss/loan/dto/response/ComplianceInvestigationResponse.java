package com.tss.loan.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for Compliance Investigation API
 * Returns the exact JSON response from SP_ComprehensiveComplianceInvestigation stored procedure
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceInvestigationResponse {
    
    @JsonProperty("investigationId")
    private String investigationId;
    
    @JsonProperty("investigationDate")
    private LocalDateTime investigationDate;
    
    @JsonProperty("applicantProfile")
    private JsonNode applicantProfile;
    
    @JsonProperty("overallAssessment")
    private JsonNode overallAssessment;
    
    @JsonProperty("bank_details")
    private JsonNode bankDetails;
    
    @JsonProperty("fraud_records")
    private JsonNode fraudRecords;
    
    @JsonProperty("loan_history")
    private JsonNode loanHistory;
    
    @JsonProperty("consolidatedFindings")
    private JsonNode consolidatedFindings;
}
