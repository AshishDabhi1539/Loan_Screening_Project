package com.tss.loan.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDocumentRequest {
    
    @NotEmpty(message = "At least one document type is required")
    private List<String> requiredDocumentTypes;
    
    @NotBlank(message = "Request reason is required")
    private String requestReason;
    
    private String additionalInstructions;
    
    private int deadlineDays; // Days to submit documents
    
    private String priorityLevel; // HIGH, MEDIUM, LOW
    
    private boolean isMandatory;
    
    private String complianceCategory; // KYC, FINANCIAL, IDENTITY, etc.
}
