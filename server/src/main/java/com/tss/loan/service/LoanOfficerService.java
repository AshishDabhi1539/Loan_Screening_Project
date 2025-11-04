package com.tss.loan.service;

import java.util.List;
import java.util.UUID;

import com.tss.loan.dto.request.DocumentResubmissionRequest;
import com.tss.loan.dto.request.DocumentVerificationRequest;
import com.tss.loan.dto.response.AuditLogResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.DocumentResubmissionResponse;
import com.tss.loan.dto.response.ExternalVerificationResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.OfficerDashboardResponse;
import com.tss.loan.entity.user.User;

/**
 * Service for loan officer operations
 */
public interface LoanOfficerService {
    
    /**
     * Get dashboard statistics for loan officer
     * @param officer The loan officer
     * @return Dashboard response with statistics
     */
    OfficerDashboardResponse getDashboard(User officer);
    
    /**
     * Get applications assigned to the officer
     * @param officer The loan officer
     * @return List of assigned applications
     */
    List<LoanApplicationResponse> getAssignedApplications(User officer);
    
    /**
     * Get specific application for review (with security check)
     * @param applicationId The application ID
     * @param officer The requesting officer
     * @return Application details
     */
    LoanApplicationResponse getApplicationForReview(UUID applicationId, User officer);
    
    /**
     * Get complete application details with all sections for manual verification
     * @param applicationId The application ID
     * @param officer The requesting officer
     * @return Complete application details with all verification sections
     */
    CompleteApplicationDetailsResponse getCompleteApplicationDetails(UUID applicationId, User officer);
    
    /**
     * Get complete application details without officer validation (for internal service use)
     * @param applicationId The application ID
     * @return Complete application details with all verification sections
     */
    CompleteApplicationDetailsResponse getCompleteApplicationDetailsInternal(UUID applicationId);
    
    /**
     * Start document verification process
     * @param applicationId The application ID
     * @param officer The loan officer
     */
    void startDocumentVerification(UUID applicationId, User officer);
    
    /**
     * Complete document verification
     * @param applicationId The application ID
     * @param request Verification details
     * @param officer The loan officer
     */
    void completeDocumentVerification(UUID applicationId, DocumentVerificationRequest request, User officer);
    
    /**
     * Trigger external verification (fraud detection) after manual verification
     * @param applicationId The application ID
     * @param officer The loan officer
     */
    void triggerExternalVerification(UUID applicationId, User officer);
    
    /**
     * Complete external verification (fraud check) with credit scoring and move directly to READY_FOR_DECISION
     * @param applicationId The application ID
     * @param officer The loan officer
     * @return Enhanced response with credit scoring details
     */
    ExternalVerificationResponse completeExternalVerification(UUID applicationId, User officer);
    
    /**
     * Get applications ready for final decision
     * @param officer The loan officer
     * @return List of applications ready for decision
     */
    List<LoanApplicationResponse> getApplicationsReadyForDecision(User officer);
    
    /**
     * Request document resubmission from applicant with automatic same-officer reassignment
     * @param applicationId The application ID
     * @param request Resubmission details
     * @param officer The loan officer
     * @return Resubmission response with details
     */
    DocumentResubmissionResponse requestDocumentResubmission(UUID applicationId, DocumentResubmissionRequest request, User officer);
    
    /**
     * Get combined audit trail for an application (audit logs + workflow history)
     * @param applicationId The application ID
     * @param officer The loan officer
     */
    List<AuditLogResponse> getApplicationAuditTrail(UUID applicationId, User officer);
    
    /**
     * Get compliance review summary for loan officer
     * Returns complete compliance investigation data, notes, and timeline
     * @param applicationId The application ID
     * @param officer The loan officer
     * @return Compliance review summary
     */
    com.tss.loan.dto.response.ComplianceReviewSummaryResponse getComplianceReviewSummary(UUID applicationId, User officer);
    
    /**
     * Acknowledge compliance review by loan officer
     * Tracks that loan officer has reviewed compliance findings before making decision
     * @param applicationId The application ID
     * @param request Acknowledgment request with optional notes
     * @param officer The loan officer
     */
    void acknowledgeComplianceReview(UUID applicationId, com.tss.loan.dto.request.AcknowledgeComplianceReviewRequest request, User officer);
    
    /**
     * Get all post-compliance applications for loan officer
     * Returns applications that went through compliance process (all statuses)
     * @param officer The loan officer
     * @return List of post-compliance applications
     */
    List<LoanApplicationResponse> getPostComplianceApplications(User officer);
    
    /**
     * Get compliance investigation data for an application
     * Returns the detailed investigation data stored by compliance officer
     */
    String getComplianceInvestigationData(UUID applicationId, User officer);
}
