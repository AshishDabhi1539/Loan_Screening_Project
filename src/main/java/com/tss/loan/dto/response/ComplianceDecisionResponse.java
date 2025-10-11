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
    private ComplianceDecisionType decisionType;
    private ApplicationStatus newStatus;
    private ApplicationStatus previousStatus;
    private String decisionReason;
    private String additionalNotes;
    private LocalDateTime decisionTimestamp;
    private String nextSteps;
    private boolean requiresRegulatoryReporting;
    private String complianceViolationType;
    private UUID escalatedToOfficerId;
    private String escalatedToOfficerName;
    private boolean canBeAppealed;
    private String recommendedAction;
}
