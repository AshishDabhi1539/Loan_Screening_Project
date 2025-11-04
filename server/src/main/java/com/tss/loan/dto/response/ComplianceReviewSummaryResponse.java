package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Complete compliance review summary for loan officer
 * Aggregates all compliance-related information for post-compliance review page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceReviewSummaryResponse {
    
    // Application identification
    private UUID applicationId;
    
    // Compliance officer who reviewed
    private ComplianceOfficerInfoDTO complianceOfficer;
    
    // Timeline information
    private ReviewTimelineDTO reviewTimeline;
    
    // Decision information
    private String decision; // APPROVED, CLEARED
    private String recommendation; // APPROVE, REJECT
    private String confidenceLevel; // HIGH, MEDIUM, LOW
    
    // Risk assessment
    private RiskAssessmentSummaryDTO riskAssessment;
    
    // Investigation findings
    private List<String> investigationFindings;
    
    // Notes from compliance officer to loan officer
    private String notesToLoanOfficer;
    
    // Document requests (if any)
    private List<DocumentRequestInfoDTO> documentsRequested;
    
    // Investigation timeline/actions
    private List<InvestigationActionDTO> investigationActions;
    
    // Acknowledgment tracking
    private Boolean hasBeenReviewedByLoanOfficer;
    private LocalDateTime reviewedByLoanOfficerAt;
    private String loanOfficerNotes;
    
    // Full investigation data (JSON) - optional, for detailed view
    private String fullInvestigationData;
}
