package com.tss.loan.service;

import java.util.List;
import java.util.UUID;

import com.tss.loan.dto.request.ComplianceDecisionRequest;
import com.tss.loan.dto.request.ComplianceDocumentRequest;
import com.tss.loan.dto.response.ComplianceDashboardResponse;
import com.tss.loan.dto.response.ComplianceDecisionResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.ComplianceInvestigationResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.user.User;

/**
 * Service interface for compliance officer operations
 */
public interface ComplianceOfficerService {
    
    /**
     * Get compliance officer dashboard with statistics and workload
     */
    ComplianceDashboardResponse getDashboard(User complianceOfficer);
    
    /**
     * Get applications assigned to compliance officer
     */
    List<LoanApplicationResponse> getAssignedApplications(User complianceOfficer);
    
    /**
     * Get specific application for compliance review
     */
    LoanApplicationResponse getApplicationForReview(UUID applicationId, User complianceOfficer);
    
    /**
     * Get complete application details for compliance verification
     */
    CompleteApplicationDetailsResponse getCompleteApplicationDetails(UUID applicationId, User complianceOfficer);
    
    /**
     * Get applications flagged for compliance review
     */
    List<LoanApplicationResponse> getFlaggedApplications(User complianceOfficer);
    
    /**
     * Get applications currently under compliance review
     */
    List<LoanApplicationResponse> getApplicationsUnderReview(User complianceOfficer);
    
    /**
     * Get applications pending compliance documents
     */
    List<LoanApplicationResponse> getApplicationsPendingDocuments(User complianceOfficer);
    
    /**
     * Start compliance investigation process
     */
    void startComplianceInvestigation(UUID applicationId, User complianceOfficer);
    
    /**
     * Request additional compliance documents from applicant
     */
    void requestComplianceDocuments(UUID applicationId, ComplianceDocumentRequest request, User complianceOfficer);
    
    /**
     * Clear application from compliance (return to normal processing)
     */
    ComplianceDecisionResponse clearCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer);
    
    /**
     * Reject application due to compliance violation
     */
    ComplianceDecisionResponse rejectForCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer);
    
    /**
     * Escalate application to senior compliance officer
     */
    void escalateToSenior(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer);
    
    /**
     * Check if compliance officer has authority to review application
     */
    boolean hasComplianceAuthority(UUID applicationId, User complianceOfficer);
    
    /**
     * Get current workload count for compliance officer
     */
    int getCurrentWorkload(User complianceOfficer);
    
    /**
     * Quick clear application from FLAGGED_FOR_COMPLIANCE directly to READY_FOR_DECISION
     */
    ComplianceDecisionResponse quickClearCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer);
    
    /**
     * Quick reject application from FLAGGED_FOR_COMPLIANCE directly to REJECTED
     */
    ComplianceDecisionResponse quickRejectCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer);
    
    /**
     * Handle document submission for PENDING_COMPLIANCE_DOCS applications
     */
    void handleDocumentSubmission(UUID applicationId, User complianceOfficer);
    
    /**
     * Process timeout for applications in PENDING_COMPLIANCE_DOCS status
     */
    void processComplianceTimeout(UUID applicationId, User complianceOfficer);
    
    /**
     * Perform comprehensive compliance investigation using stored procedure
     * Returns the exact JSON response from SP_ComprehensiveComplianceInvestigation
     */
    ComplianceInvestigationResponse performComprehensiveInvestigation(UUID applicationId, User complianceOfficer);
    
    /**
     * Track document view by compliance officer
     */
    void trackDocumentView(Long documentId, User complianceOfficer);
    
    /**
     * Verify a single compliance document
     */
    void verifyComplianceDocument(Long documentId, boolean verified, String notes, String rejectionReason, User complianceOfficer);
    
    /**
     * Get compliance document request details for an application
     * Returns the requested document types to help identify compliance-requested documents
     */
    com.tss.loan.dto.response.ComplianceDocumentRequestDetailsResponse getComplianceDocumentRequestDetails(UUID applicationId, User complianceOfficer);
    
    /**
     * Trigger decision process - moves application to AWAITING_COMPLIANCE_DECISION status
     */
    void triggerDecision(UUID applicationId, com.tss.loan.dto.request.ComplianceTriggerDecisionRequest request, User complianceOfficer);
    
    /**
     * Get applications awaiting compliance decision
     */
    List<LoanApplicationResponse> getApplicationsAwaitingDecision(User complianceOfficer);
    
    /**
     * Submit compliance decision (approve/reject) with notes to loan officer
     */
    com.tss.loan.dto.response.ComplianceDecisionResponse submitComplianceDecision(UUID applicationId, com.tss.loan.dto.request.ComplianceSubmitDecisionRequest request, User complianceOfficer);
}
