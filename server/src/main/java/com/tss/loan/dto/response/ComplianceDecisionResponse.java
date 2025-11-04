package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.tss.loan.dto.request.ComplianceDecisionRequest.ComplianceDecisionType;
import com.tss.loan.entity.enums.ApplicationStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDecisionResponse {
    
    private UUID applicationId;
    private UUID complianceOfficerId;
    private String complianceOfficerName;
    private String decision; // Quick decision type (QUICK_CLEARED, QUICK_REJECTED, etc.)
    private ComplianceDecisionType decisionType;
    private ApplicationStatus newStatus;
    private ApplicationStatus previousStatus;
    private String decisionNotes; // Changed from decisionReason to match request
    private String additionalNotes;
    private LocalDateTime processedAt; // Changed from decisionTimestamp
    private String processedBy; // Added for officer email
    private String nextSteps;
    private boolean requiresRegulatoryReporting;
    private String complianceViolationType;
    private UUID escalatedToOfficerId;
    private String escalatedToOfficerName;
    private boolean canBeAppealed;
    private String recommendedAction;
    
    /**
     * Full investigation data (JSON) from compliance investigation stored procedure
     * This is sent to loan officer so they can review the investigation results
     * when making final decision
     */
    private String investigationData;
}
