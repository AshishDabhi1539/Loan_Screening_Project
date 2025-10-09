package com.tss.loan.controller.applicant;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tss.loan.dto.request.ApplicantFinancialDetailsRequest;
import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
import com.tss.loan.dto.request.LoanApplicationRequest;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.LoanApplicationCreateResponse;
import com.tss.loan.dto.response.ProfileStatusResponse;
import com.tss.loan.dto.response.PersonalDetailsUpdateResponse;
import com.tss.loan.dto.response.PersonalDetailsCreateResponse;
import com.tss.loan.dto.response.FinancialDetailsCreateResponse;
import com.tss.loan.dto.response.DocumentUploadResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.service.ProfileCompletionService;
import com.tss.loan.entity.loan.LoanDocument;
import com.tss.loan.entity.enums.DocumentType;
import com.tss.loan.entity.user.User;
import com.tss.loan.service.DocumentUploadService;
import com.tss.loan.service.LoanApplicationService;
import com.tss.loan.service.PersonalDetailsService;
import com.tss.loan.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/loan-application")
@PreAuthorize("hasRole('APPLICANT')")
@Slf4j
public class LoanApplicationController {
    
    @Autowired
    private LoanApplicationService loanApplicationService;
    
    @Autowired
    private DocumentUploadService documentUploadService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ProfileCompletionService profileCompletionService;
    
    @Autowired
    private PersonalDetailsService personalDetailsService;
    
    /**
     * Create new loan application
     */
    @PostMapping("/create")
    public ResponseEntity<LoanApplicationCreateResponse> createLoanApplication(
            @Valid @RequestBody LoanApplicationRequest request,
            Authentication authentication) {
        
        log.info("Creating loan application for: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        LoanApplicationCreateResponse application = loanApplicationService.createLoanApplicationWithMinimalResponse(request, user);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }
    
    /**
     * Update personal details for existing application (gets existing data from application context)
     */
    @PutMapping("/{applicationId}/personal-details")
    public ResponseEntity<PersonalDetailsUpdateResponse> updatePersonalDetailsForApplication(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ApplicantPersonalDetailsRequest request,
            Authentication authentication) {
        
        log.info("Updating personal details for application: {}", applicationId);
        
        User user = getCurrentUser(authentication);
        PersonalDetailsUpdateResponse response = loanApplicationService.updatePersonalDetailsFromApplication(applicationId, request, user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Create financial details for application
     */
    @PostMapping("/{applicationId}/financial-details")
    public ResponseEntity<FinancialDetailsCreateResponse> createFinancialDetails(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ApplicantFinancialDetailsRequest request,
            Authentication authentication) {
        
        log.info("Creating financial details for application: {}", applicationId);
        
        User user = getCurrentUser(authentication);
        FinancialDetailsCreateResponse response = loanApplicationService.createFinancialDetailsForApplication(applicationId, request, user);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Update financial details
     */
    @PutMapping("/{applicationId}/financial-details")
    public ResponseEntity<FinancialDetailsCreateResponse> updateFinancialDetails(
            @PathVariable UUID applicationId,
            @Valid @RequestBody ApplicantFinancialDetailsRequest request,
            Authentication authentication) {
        
        log.info("Updating financial details for application: {}", applicationId);
        
        User user = getCurrentUser(authentication);
        FinancialDetailsCreateResponse response = loanApplicationService.updateFinancialDetailsForApplication(applicationId, request, user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Upload document
     */
    @PostMapping("/{applicationId}/documents/upload")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @PathVariable UUID applicationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            Authentication authentication) throws IOException {
        
        log.info("Uploading document for application: {} - Type: {}", applicationId, documentType);
        
        User user = getCurrentUser(authentication);
        DocumentUploadResponse response = documentUploadService.uploadDocumentWithResponse(file, documentType, applicationId, user);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get all documents for application
     */
    @GetMapping("/{applicationId}/documents")
    public ResponseEntity<List<LoanDocument>> getDocuments(@PathVariable UUID applicationId) {
        log.info("Fetching documents for application: {}", applicationId);
        
        List<LoanDocument> documents = documentUploadService.getDocumentsByLoanApplication(applicationId);
        return ResponseEntity.ok(documents);
    }
    
    /**
     * Submit loan application
     */
    @PostMapping("/{applicationId}/submit")
    public ResponseEntity<LoanApplication> submitApplication(
            @PathVariable UUID applicationId,
            Authentication authentication) {
        
        log.info("Submitting loan application: {}", applicationId);
        
        User user = getCurrentUser(authentication);
        LoanApplication application = loanApplicationService.submitLoanApplication(applicationId, user);
        
        return ResponseEntity.ok(application);
    }
    
    /**
     * Get loan application by ID
     */
    @GetMapping("/{applicationId}")
    public ResponseEntity<LoanApplicationResponse> getLoanApplication(@PathVariable UUID applicationId) {
        log.info("Fetching loan application: {}", applicationId);
        
        LoanApplicationResponse application = loanApplicationService.getLoanApplicationById(applicationId);
        return ResponseEntity.ok(application);
    }
    
    /**
     * Get all loan applications for current user
     */
    @GetMapping("/my-applications")
    public ResponseEntity<List<LoanApplicationResponse>> getMyApplications(Authentication authentication) {
        log.info("Fetching applications for user: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        List<LoanApplicationResponse> applications = loanApplicationService.getLoanApplicationsByUser(user);
        
        return ResponseEntity.ok(applications);
    }
    
    /**
     * Get application progress
     */
    @GetMapping("/{applicationId}/progress")
    public ResponseEntity<Integer> getApplicationProgress(@PathVariable UUID applicationId) {
        log.info("Fetching progress for application: {}", applicationId);
        
        int progress = loanApplicationService.calculateApplicationProgress(applicationId);
        return ResponseEntity.ok(progress);
    }
    
    /**
     * Check if application is complete
     */
    @GetMapping("/{applicationId}/complete")
    public ResponseEntity<Boolean> isApplicationComplete(@PathVariable UUID applicationId) {
        log.info("Checking completion status for application: {}", applicationId);
        
        boolean isComplete = loanApplicationService.isApplicationComplete(applicationId);
        return ResponseEntity.ok(isComplete);
    }
    
    /**
     * Check if user has completed personal details (required before loan application)
     */
    @GetMapping("/profile-status")
    public ResponseEntity<ProfileStatusResponse> hasPersonalDetails(Authentication authentication) {
        log.info("Checking personal details completion for user: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        ProfileStatusResponse response = profileCompletionService.getProfileStatus(user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Create/Update personal details directly (not tied to specific loan application)
     */
    @PostMapping("/personal-details")
    public ResponseEntity<PersonalDetailsCreateResponse> createPersonalDetails(
            @Valid @RequestBody ApplicantPersonalDetailsRequest request,
            Authentication authentication) {
        
        log.info("Creating/updating personal details for user: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        PersonalDetailsCreateResponse response = personalDetailsService.createOrUpdatePersonalDetailsWithResponse(request, user);
        
        return ResponseEntity.ok(response);
    }
    
    private User getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userService.findByEmail(userDetails.getUsername());
    }
}
