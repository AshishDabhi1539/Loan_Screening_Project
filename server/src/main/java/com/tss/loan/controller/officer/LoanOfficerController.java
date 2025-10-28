package com.tss.loan.controller.officer;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.loan.dto.request.ComplianceFlagRequest;
import com.tss.loan.dto.request.DocumentResubmissionRequest;
import com.tss.loan.dto.request.DocumentVerificationRequest;
import com.tss.loan.dto.request.LoanDecisionRequest;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.DocumentResubmissionResponse;
import com.tss.loan.dto.response.ExternalVerificationResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.LoanDecisionResponse;
import com.tss.loan.dto.response.OfficerDashboardResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.service.DecisionManagementService;
import com.tss.loan.service.LoanOfficerService;
import com.tss.loan.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/officer")
@PreAuthorize("hasRole('LOAN_OFFICER') or hasRole('SENIOR_LOAN_OFFICER')")
@Slf4j
public class LoanOfficerController {
    
    @Autowired
    private LoanOfficerService loanOfficerService;
    
    @Autowired
    private DecisionManagementService decisionManagementService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get loan officer dashboard with statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<OfficerDashboardResponse> getDashboard(Authentication authentication) {
        log.info("Fetching dashboard for officer: {}", authentication.getName());
        
        User officer = getCurrentUser(authentication);
        OfficerDashboardResponse dashboard = loanOfficerService.getDashboard(officer);
        
        return ResponseEntity.ok(dashboard);
    }
    
    /**
     * Get applications assigned to current officer
     */
    @GetMapping("/assigned-applications")
    public ResponseEntity<List<LoanApplicationResponse>> getAssignedApplications(Authentication authentication) {
        log.info("Fetching assigned applications for officer: {}", authentication.getName());
        
        User officer = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = loanOfficerService.getAssignedApplications(officer);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Get specific application details for review
     */
    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<LoanApplicationResponse> getApplicationForReview(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Officer {} reviewing application: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        LoanApplicationResponse application = loanOfficerService.getApplicationForReview(applicationId, officer);
        
        return ResponseEntity.ok(application);
    }
    
    /**
     * Get complete application details with all sections for manual verification
     */
    @GetMapping("/applications/{applicationId}/complete-details")
    public ResponseEntity<CompleteApplicationDetailsResponse> getCompleteApplicationDetails(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Officer {} requesting complete details for application: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        CompleteApplicationDetailsResponse details = loanOfficerService.getCompleteApplicationDetails(applicationId, officer);
        
        return ResponseEntity.ok(details);
    }
    
    /**
     * Start document verification process
     */
    @PostMapping("/applications/{applicationId}/start-verification")
    public ResponseEntity<String> startDocumentVerification(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Starting document verification for application: {}", applicationId);
        
        User officer = getCurrentUser(authentication);
        loanOfficerService.startDocumentVerification(applicationId, officer);
        
        return ResponseEntity.ok("Document verification started successfully");
    }
    
    /**
     * Complete document verification
     */
    @PostMapping("/applications/{applicationId}/verify-documents")
    public ResponseEntity<String> verifyDocuments(
            @PathVariable UUID applicationId,
            @Valid @RequestBody DocumentVerificationRequest request,
            Authentication authentication) {
        
        log.info("Completing document verification for application: {}", applicationId);
        
        User officer = getCurrentUser(authentication);
        loanOfficerService.completeDocumentVerification(applicationId, request, officer);
        
        return ResponseEntity.ok("Document verification completed successfully");
    }
    
    /**
     * Trigger external verification (fraud detection)
     */
    @PostMapping("/applications/{applicationId}/trigger-external-verification")
    public ResponseEntity<String> triggerExternalVerification(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Triggering external verification for application: {}", applicationId);
        
        User officer = getCurrentUser(authentication);
        loanOfficerService.triggerExternalVerification(applicationId, officer);
        
        return ResponseEntity.ok("External verification triggered successfully");
    }
    
    /**
     * Complete external verification (fraud check) with credit scoring
     */
    @PostMapping("/applications/{applicationId}/complete-external-verification")
    public ResponseEntity<ExternalVerificationResponse> completeExternalVerification(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Officer {} completing external verification for application: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        ExternalVerificationResponse response = loanOfficerService.completeExternalVerification(applicationId, officer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get applications ready for final decision
     */
    @GetMapping("/ready-for-decision")
    public ResponseEntity<List<LoanApplicationResponse>> getApplicationsReadyForDecision(Authentication authentication) {
        log.info("Fetching applications ready for decision for officer: {}", authentication.getName());
        
        User officer = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = loanOfficerService.getApplicationsReadyForDecision(officer);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Request document resubmission from applicant
     */
    @PostMapping("/applications/{applicationId}/request-resubmission")
    public ResponseEntity<DocumentResubmissionResponse> requestDocumentResubmission(
            @PathVariable UUID applicationId,
            @Valid @RequestBody DocumentResubmissionRequest request,
            Authentication authentication) {
        
        log.info("Officer {} requesting document resubmission for application: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        DocumentResubmissionResponse response = loanOfficerService.requestDocumentResubmission(applicationId, request, officer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Approve loan application
     */
    @PostMapping("/applications/{applicationId}/approve")
    public ResponseEntity<LoanDecisionResponse> approveLoanApplication(
            @PathVariable UUID applicationId,
            @Valid @RequestBody LoanDecisionRequest request,
            Authentication authentication) {
        
        log.info("Officer {} approving application: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        LoanDecisionResponse response = decisionManagementService.approveLoanApplication(applicationId, request, officer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Reject loan application
     */
    @PostMapping("/applications/{applicationId}/reject")
    public ResponseEntity<LoanDecisionResponse> rejectLoanApplication(
            @PathVariable UUID applicationId,
            @Valid @RequestBody LoanDecisionRequest request,
            Authentication authentication) {
        
        log.info("Officer {} rejecting application: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        LoanDecisionResponse response = decisionManagementService.rejectLoanApplication(applicationId, request, officer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Flag application for compliance review
     */
    @PostMapping("/applications/{applicationId}/flag-for-compliance")
    public ResponseEntity<LoanDecisionResponse> flagForCompliance(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ComplianceFlagRequest request,
            Authentication authentication) {
        
        log.info("Officer {} flagging application for compliance: {}", authentication.getName(), applicationId);
        
        User officer = getCurrentUser(authentication);
        LoanDecisionResponse response = decisionManagementService.flagForCompliance(applicationId, request, officer);
        
        return ResponseEntity.ok(response);
    }
    
    private User getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userService.findByEmail(userDetails.getUsername());
    }
}
