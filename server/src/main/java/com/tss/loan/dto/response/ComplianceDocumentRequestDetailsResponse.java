package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for compliance document request details
 * Used to identify which document types were requested by compliance officer
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDocumentRequestDetailsResponse {
    private Long requestId;
    private List<String> requiredDocumentTypes; // List of document type strings like ["PAN_CARD", "BANK_STATEMENT"]
    private String requestReason;
    private String additionalInstructions;
    private LocalDateTime requestedAt;
    private String status; // PENDING, RECEIVED, FULFILLED, EXPIRED
    private Integer deadlineDays;
    private String priorityLevel;
    private Boolean isMandatory;
    private String complianceCategory;
}

