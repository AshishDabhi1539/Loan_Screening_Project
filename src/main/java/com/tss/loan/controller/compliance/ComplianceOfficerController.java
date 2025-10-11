package com.tss.loan.controller.compliance;

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

import com.tss.loan.dto.request.ComplianceDecisionRequest;
import com.tss.loan.dto.request.ComplianceDocumentRequest;
import com.tss.loan.dto.response.ComplianceDashboardResponse;
import com.tss.loan.dto.response.ComplianceDecisionResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.service.ComplianceOfficerService;
import com.tss.loan.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/compliance")
@PreAuthorize("hasRole('COMPLIANCE_OFFICER') or hasRole('SENIOR_COMPLIANCE_OFFICER')")
@Slf4j
public class ComplianceOfficerController {
    
    @Autowired
    private ComplianceOfficerService complianceOfficerService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get compliance officer dashboard with statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ComplianceDashboardResponse> getDashboard(Authentication authentication) {
        log.info("Fetching compliance dashboard for officer: {}", authentication.getName());
        
        User complianceOfficer = getCurrentUser(authentication);
        ComplianceDashboardResponse dashboard = complianceOfficerService.getDashboard(complianceOfficer);
        
        return ResponseEntity.ok(dashboard);
    }
    
    /**
     * Get applications assigned to current compliance officer
     */
    @GetMapping("/assigned-applications")
    public ResponseEntity<List<LoanApplicationResponse>> getAssignedApplications(Authentication authentication) {
        log.info("Fetching assigned compliance applications for officer: {}", authentication.getName());
        
        User complianceOfficer = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = complianceOfficerService.getAssignedApplications(complianceOfficer);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Get specific application details for compliance review
     */
    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<LoanApplicationResponse> getApplicationForReview(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Compliance officer {} reviewing application: {}", authentication.getName(), applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        LoanApplicationResponse application = complianceOfficerService.getApplicationForReview(applicationId, complianceOfficer);
        
        return ResponseEntity.ok(application);
    }
    
    /**
     * Get complete application details with all sections for compliance verification
     */
    @GetMapping("/applications/{applicationId}/complete-details")
    public ResponseEntity<CompleteApplicationDetailsResponse> getCompleteApplicationDetails(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Compliance officer {} requesting complete details for application: {}", authentication.getName(), applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        CompleteApplicationDetailsResponse details = complianceOfficerService.getCompleteApplicationDetails(applicationId, complianceOfficer);
        
        return ResponseEntity.ok(details);
    }
    
    /**
     * Get applications flagged for compliance review
     */
    @GetMapping("/flagged-applications")
    public ResponseEntity<List<LoanApplicationResponse>> getFlaggedApplications(Authentication authentication) {
        log.info("Fetching flagged applications for compliance officer: {}", authentication.getName());
        
        User complianceOfficer = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = complianceOfficerService.getFlaggedApplications(complianceOfficer);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Get applications in compliance review
     */
    @GetMapping("/under-review")
    public ResponseEntity<List<LoanApplicationResponse>> getApplicationsUnderReview(Authentication authentication) {
        log.info("Fetching applications under compliance review for officer: {}", authentication.getName());
        
        User complianceOfficer = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = complianceOfficerService.getApplicationsUnderReview(complianceOfficer);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Get applications pending compliance documents
     */
    @GetMapping("/pending-documents")
    public ResponseEntity<List<LoanApplicationResponse>> getApplicationsPendingDocuments(Authentication authentication) {
        log.info("Fetching applications pending compliance documents for officer: {}", authentication.getName());
        
        User complianceOfficer = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = complianceOfficerService.getApplicationsPendingDocuments(complianceOfficer);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Start compliance investigation
     */
    @PostMapping("/applications/{applicationId}/start-investigation")
    public ResponseEntity<String> startComplianceInvestigation(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Starting compliance investigation for application: {}", applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        complianceOfficerService.startComplianceInvestigation(applicationId, complianceOfficer);
        
        return ResponseEntity.ok("Compliance investigation started successfully");
    }
    
    /**
     * Request additional compliance documents
     */
    @PostMapping("/applications/{applicationId}/request-documents")
    public ResponseEntity<String> requestComplianceDocuments(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ComplianceDocumentRequest request,
            Authentication authentication) {
        
        log.info("Compliance officer {} requesting additional documents for application: {}", authentication.getName(), applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        complianceOfficerService.requestComplianceDocuments(applicationId, request, complianceOfficer);
        
        return ResponseEntity.ok("Compliance document request sent successfully");
    }
    
    /**
     * Clear application from compliance (return to normal processing)
     */
    @PostMapping("/applications/{applicationId}/clear-compliance")
    public ResponseEntity<ComplianceDecisionResponse> clearCompliance(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ComplianceDecisionRequest request,
            Authentication authentication) {
        
        log.info("Compliance officer {} clearing application: {}", authentication.getName(), applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        ComplianceDecisionResponse response = complianceOfficerService.clearCompliance(applicationId, request, complianceOfficer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Reject application due to compliance violation
     */
    @PostMapping("/applications/{applicationId}/reject-compliance")
    public ResponseEntity<ComplianceDecisionResponse> rejectForCompliance(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ComplianceDecisionRequest request,
            Authentication authentication) {
        
        log.info("Compliance officer {} rejecting application for compliance violation: {}", authentication.getName(), applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        ComplianceDecisionResponse response = complianceOfficerService.rejectForCompliance(applicationId, request, complianceOfficer);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Escalate to senior compliance officer
     */
    @PostMapping("/applications/{applicationId}/escalate")
    public ResponseEntity<String> escalateToSenior(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ComplianceDecisionRequest request,
            Authentication authentication) {
        
        log.info("Compliance officer {} escalating application to senior: {}", authentication.getName(), applicationId);
        
        User complianceOfficer = getCurrentUser(authentication);
        complianceOfficerService.escalateToSenior(applicationId, request, complianceOfficer);
        
        return ResponseEntity.ok("Application escalated to senior compliance officer successfully");
    }
    
    private User getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userService.findByEmail(userDetails.getUsername());
    }
}
