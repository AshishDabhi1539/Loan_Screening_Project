package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.request.ApplicantFinancialDetailsRequest;
import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
import com.tss.loan.dto.request.LoanApplicationRequest;
import com.tss.loan.dto.request.ProfessionalEmploymentDetailsRequest;
import com.tss.loan.dto.request.FreelancerEmploymentDetailsRequest;
import com.tss.loan.dto.request.RetiredEmploymentDetailsRequest;
import com.tss.loan.dto.request.StudentEmploymentDetailsRequest;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.LoanApplicationCreateResponse;
import com.tss.loan.dto.response.PersonalDetailsUpdateResponse;
import com.tss.loan.dto.response.FinancialDetailsCreateResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.entity.financial.ApplicantFinancialProfile;
import com.tss.loan.entity.financial.ProfessionalEmploymentDetails;
import com.tss.loan.entity.financial.FreelancerEmploymentDetails;
import com.tss.loan.entity.financial.RetiredEmploymentDetails;
import com.tss.loan.entity.financial.StudentEmploymentDetails;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.enums.RiskLevel;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.ApplicantFinancialProfileRepository;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.LoanDocumentRepository;
import com.tss.loan.service.ApplicationAssignmentService;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.LoanApplicationService;
import com.tss.loan.service.NotificationService;
import com.tss.loan.service.ProfileCompletionService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class LoanApplicationServiceImpl implements LoanApplicationService {

    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    @Autowired
    private ApplicantFinancialProfileRepository financialProfileRepository;
    
    @Autowired
    private LoanDocumentRepository documentRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private LoanApplicationMapper loanApplicationMapper;
    
    @Autowired
    private ProfileCompletionService profileCompletionService;
    
    @Autowired
    private ApplicationWorkflowService applicationWorkflowService;
    
    @Autowired
    private ApplicationAssignmentService applicationAssignmentService;

    @Override
    public LoanApplicationResponse createLoanApplication(LoanApplicationRequest request, User applicant) {
        log.info("Creating loan application for user: {}", applicant.getEmail());
        
        // Validate user can apply for loan
        if (!profileCompletionService.canApplyForLoan(applicant)) {
            throw new LoanApiException("Please complete your personal details before applying for a loan");
        }
        
        // Create loan application
        LoanApplication application = new LoanApplication();
        application.setApplicant(applicant);
        // Use smart name resolution: PersonalDetails.fullName > User.email
        application.setApplicantName(profileCompletionService.getDisplayName(applicant));
        application.setApplicantEmail(applicant.getEmail());
        application.setApplicantPhone(applicant.getPhone());
        application.setLoanType(request.getLoanType());
        application.setRequestedAmount(request.getLoanAmount());
        application.setTenureMonths(request.getTenureMonths());
        application.setPurpose(request.getPurpose());
        application.setRemarks(request.getAdditionalNotes());
        application.setStatus(ApplicationStatus.DRAFT);
        
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Create notification
        notificationService.createNotification(
            applicant,
            NotificationType.IN_APP,
            "Loan Application Created",
            "Your loan application has been created successfully. Please complete all sections to submit."
        );
        
        // Audit log
        auditLogService.logAction(applicant, "LOAN_APPLICATION_CREATED", "LoanApplication", null,
            "Loan application created: " + request.getLoanType() + " - ₹" + request.getLoanAmount());
        
        log.info("Loan application created successfully with ID: {}", savedApplication.getId());
        return loanApplicationMapper.toResponse(savedApplication);
    }

    @Override
    public LoanApplication updatePersonalDetails(UUID applicationId, 
                                               ApplicantPersonalDetailsRequest request, User user) {
        log.info("Updating personal details for application: {}", applicationId);
        
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        validateApplicationOwnership(application, user);
        validateApplicationStatus(application, ApplicationStatus.DRAFT);
        
        // Check if personal details already exist for this user
        ApplicantPersonalDetails personalDetails = personalDetailsRepository
            .findByUserId(user.getId())
            .orElse(new ApplicantPersonalDetails());
        
        // Update personal details with new User-based relationship
        personalDetails.setUser(user);
        // Update name fields
        personalDetails.setFirstName(request.getFirstName());
        personalDetails.setLastName(request.getLastName());
        personalDetails.setMiddleName(request.getMiddleName());
        personalDetails.setDateOfBirth(request.getDateOfBirth());
        personalDetails.setGender(request.getGender().toString());
        personalDetails.setMaritalStatus(request.getMaritalStatus().toString());
        personalDetails.setPanNumber(request.getPanNumber().toUpperCase());
        personalDetails.setAadhaarNumber(request.getAadhaarNumber());
        personalDetails.setPhoneNumber(request.getCurrentAddressLine1()); // Need to map correctly
        personalDetails.setEmailAddress(application.getApplicantEmail());
        
        // Current Address - combine address lines
        String currentFullAddress = request.getCurrentAddressLine1();
        if (request.getCurrentAddressLine2() != null && !request.getCurrentAddressLine2().trim().isEmpty()) {
            currentFullAddress += ", " + request.getCurrentAddressLine2();
        }
        personalDetails.setCurrentAddress(currentFullAddress);
        personalDetails.setCurrentCity(request.getCurrentCity());
        personalDetails.setCurrentState(request.getCurrentState());
        personalDetails.setCurrentPincode(request.getCurrentPincode());
        
        // Permanent Address
        if (request.isSameAsCurrent()) {
            personalDetails.setPermanentAddress(currentFullAddress);
            personalDetails.setPermanentCity(request.getCurrentCity());
            personalDetails.setPermanentState(request.getCurrentState());
            personalDetails.setPermanentPincode(request.getCurrentPincode());
            personalDetails.setIsSameAddress(true);
        } else {
            String permanentFullAddress = request.getPermanentAddressLine1();
            if (request.getPermanentAddressLine2() != null && !request.getPermanentAddressLine2().trim().isEmpty()) {
                permanentFullAddress += ", " + request.getPermanentAddressLine2();
            }
            personalDetails.setPermanentAddress(permanentFullAddress);
            personalDetails.setPermanentCity(request.getPermanentCity());
            personalDetails.setPermanentState(request.getPermanentState());
            personalDetails.setPermanentPincode(request.getPermanentPincode());
            personalDetails.setIsSameAddress(false);
        }
        
        // Family details
        personalDetails.setFatherName(request.getFatherName());
        personalDetails.setMotherName(request.getMotherName());
        
        personalDetails.setUpdatedAt(LocalDateTime.now());
        personalDetailsRepository.save(personalDetails);
        
        // Update application timestamp
        application.setUpdatedAt(LocalDateTime.now());
        LoanApplication updatedApplication = loanApplicationRepository.save(application);
        
        // Audit log
        auditLogService.logAction(user, "PERSONAL_DETAILS_UPDATED", "LoanApplication", null,
            "Personal details updated for application: " + applicationId);
        
        log.info("Personal details updated successfully for application: {}", applicationId);
        return updatedApplication;
    }

    @Override
    public LoanApplication updateFinancialDetails(UUID applicationId, 
                                                ApplicantFinancialDetailsRequest request, User user) {
        log.info("Updating financial details for application: {}", applicationId);
        
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        validateApplicationOwnership(application, user);
        validateApplicationStatus(application, ApplicationStatus.DRAFT);
        
        // Check if financial profile already exists
        ApplicantFinancialProfile financialProfile = financialProfileRepository
            .findByLoanApplication(application)
            .orElse(new ApplicantFinancialProfile());
        
        // Update financial profile - map to correct field names
        financialProfile.setLoanApplication(application);
        financialProfile.setEmploymentType(request.getEmploymentType());
        financialProfile.setEmployerName(request.getCompanyName());
        financialProfile.setDesignation(request.getJobTitle());
        financialProfile.setEmploymentStartDate(request.getEmploymentStartDate());
        financialProfile.setWorkAddress(request.getCompanyAddress());
        financialProfile.setWorkCity(request.getCompanyCity());
        
        // Income details
        financialProfile.setPrimaryMonthlyIncome(request.getMonthlyIncome());
        financialProfile.setSecondaryIncome(request.getAdditionalIncome());
        financialProfile.setExistingEmiAmount(request.getExistingLoanEmi());
        financialProfile.setMonthlyExpenses(request.getMonthlyExpenses());
        
        // Banking details
        financialProfile.setPrimaryBankName(request.getBankName());
        financialProfile.setPrimaryAccountNumber(request.getAccountNumber());
        financialProfile.setIfscCode(request.getIfscCode());
        financialProfile.setAccountType(request.getAccountType());
        
        financialProfile.setUpdatedAt(LocalDateTime.now());
        financialProfileRepository.save(financialProfile);
        
        // Update application timestamp
        application.setUpdatedAt(LocalDateTime.now());
        LoanApplication updatedApplication = loanApplicationRepository.save(application);
        
        // Audit log
        auditLogService.logAction(user, "FINANCIAL_DETAILS_UPDATED", "LoanApplication", null,
            "Financial details updated for application: " + applicationId);
        
        log.info("Financial details updated successfully for application: {}", applicationId);
        return updatedApplication;
    }

    @Override
    @Transactional
    public LoanApplication submitLoanApplication(UUID applicationId, User user) {
        log.info("Submitting loan application: {}", applicationId);
        
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        validateApplicationOwnership(application, user);
        validateApplicationStatus(application, ApplicationStatus.DRAFT);
        
        // Check if application is complete
        if (!isApplicationComplete(applicationId)) {
            throw new LoanApiException("Application is incomplete. Please fill all required sections.");
        }
        
        // Update status to SUBMITTED
        application.setStatus(ApplicationStatus.SUBMITTED);
        application.setSubmittedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication submittedApplication = loanApplicationRepository.save(application);
        
        // Create workflow entry for DRAFT → SUBMITTED transition
        applicationWorkflowService.createWorkflowEntry(
            applicationId,
            ApplicationStatus.DRAFT,
            ApplicationStatus.SUBMITTED,
            user,
            "Application submitted by applicant"
        );
        
        // AUTO-ASSIGN TO LOAN OFFICER (Your requested workflow)
        try {
            User assignedOfficer = applicationAssignmentService.assignToLoanOfficer(submittedApplication);
            
            // Create workflow entry for SUBMITTED → UNDER_REVIEW transition
            applicationWorkflowService.createWorkflowEntry(
                applicationId,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.UNDER_REVIEW,
                assignedOfficer,
                "Application auto-assigned to loan officer: " + assignedOfficer.getEmail()
            );
            
            // Notify the assigned loan officer
            notificationService.createNotification(
                assignedOfficer,
                NotificationType.IN_APP,
                "New Loan Application Assigned",
                "A new loan application has been assigned to you for review. Application ID: " + applicationId
            );
            
            log.info("Application {} auto-assigned to officer: {}", applicationId, assignedOfficer.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to auto-assign application {}: {}", applicationId, e.getMessage());
            // Don't fail the submission, just log the error
        }
        
        // Create notification for applicant
        notificationService.createNotification(
            user,
            NotificationType.EMAIL,
            "Loan Application Submitted",
            "Your loan application has been submitted successfully and assigned to a loan officer for review."
        );
        
        // Audit log
        auditLogService.logAction(user, "LOAN_APPLICATION_SUBMITTED", "LoanApplication", null,
            "Loan application submitted: " + applicationId);
        
        log.info("Loan application submitted successfully: {}", applicationId);
        return submittedApplication;
    }

    @Override
    @Transactional(readOnly = true)
    public LoanApplicationResponse getLoanApplicationById(UUID applicationId) {
        LoanApplication entity = getLoanApplicationEntityById(applicationId);
        return loanApplicationMapper.toResponse(entity);
    }
    
    @Override
    public LoanApplication getLoanApplicationEntityById(UUID applicationId) {
        return loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Loan application not found with ID: " + applicationId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanApplicationResponse> getLoanApplicationsByUser(User user) {
        List<LoanApplication> entities = loanApplicationRepository.findByApplicantIdOrderByCreatedAtDesc(user.getId());
        return entities.stream()
                .map(loanApplicationMapper::toResponse)
                .toList();
    }

    @Override
    public List<LoanApplicationResponse> getLoanApplicationsByStatus(String status) {
        ApplicationStatus applicationStatus = ApplicationStatus.valueOf(status.toUpperCase());
        List<LoanApplication> entities = loanApplicationRepository.findByStatusOrderByCreatedAtDesc(applicationStatus);
        return entities.stream()
                .map(loanApplicationMapper::toResponse)
                .toList();
    }

    @Override
    public boolean isApplicationComplete(UUID applicationId) {
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        
        // Check if personal details exist for the applicant
        boolean hasPersonalDetails = personalDetailsRepository.existsByUserId(application.getApplicant().getId());
        
        // Check if financial details exist
        boolean hasFinancialDetails = financialProfileRepository.findByLoanApplication(application).isPresent();
        
        // Check if required documents are uploaded
        long documentCount = documentRepository.countByLoanApplicationId(applicationId);
        boolean hasRequiredDocuments = documentCount >= 3; // Minimum 3 documents required
        
        return hasPersonalDetails && hasFinancialDetails && hasRequiredDocuments;
    }

    @Override
    public int calculateApplicationProgress(UUID applicationId) {
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        int progress = 0;
        
        // Basic application info (20%)
        progress += 20;
        
        // Personal details (30%)
        if (personalDetailsRepository.existsByUserId(application.getApplicant().getId())) {
            progress += 30;
        }
        
        // Financial details (30%)
        if (financialProfileRepository.findByLoanApplication(application).isPresent()) {
            progress += 30;
        }
        
        // Documents (20%)
        long documentCount = documentRepository.countByLoanApplicationId(applicationId);
        if (documentCount >= 3) {
            progress += 20;
        } else if (documentCount > 0) {
            progress += (int) (20 * documentCount / 3);
        }
        
        return Math.min(progress, 100);
    }
    
    private void validateApplicationOwnership(LoanApplication application, User user) {
        if (!application.getApplicant().getId().equals(user.getId())) {
            throw new LoanApiException("You are not authorized to access this application");
        }
    }
    
    private void validateApplicationStatus(LoanApplication application, ApplicationStatus expectedStatus) {
        if (!application.getStatus().equals(expectedStatus)) {
            throw new LoanApiException("Application is not in " + expectedStatus + " status");
        }
    }
    
    @Override
    public LoanApplicationCreateResponse createLoanApplicationWithMinimalResponse(LoanApplicationRequest request, User applicant) {
        log.info("Creating loan application with minimal response for user: {}", applicant.getId());
        
        // Validate user can apply for loan
        if (!profileCompletionService.canApplyForLoan(applicant)) {
            throw new LoanApiException("Please complete your personal details before applying for a loan");
        }
        
        // Create loan application
        LoanApplication application = new LoanApplication();
        application.setApplicant(applicant);
        // Use smart name resolution: PersonalDetails.fullName > User.email
        application.setApplicantName(profileCompletionService.getDisplayName(applicant));
        application.setApplicantEmail(applicant.getEmail());
        application.setApplicantPhone(applicant.getPhone());
        
        // Set loan details
        application.setLoanType(request.getLoanType());
        application.setRequestedAmount(request.getLoanAmount());
        application.setTenureMonths(request.getTenureMonths());
        application.setPurpose(request.getPurpose());
        application.setRemarks(request.getAdditionalNotes());
        
        // Set initial status
        application.setStatus(ApplicationStatus.DRAFT);
        application.setRiskLevel(RiskLevel.LOW); // Default risk level
        
        // Save application
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Create notification
        notificationService.createNotification(
            applicant,
            NotificationType.IN_APP,
            "Loan Application Created",
            "Your loan application has been created successfully. Please complete all required sections."
        );
        
        // Audit log
        auditLogService.logAction(applicant, "LOAN_APPLICATION_CREATED", "LoanApplication", null,
            "Loan application created: " + savedApplication.getId());
        
        log.info("Loan application created successfully: {}", savedApplication.getId());
        
        // Return minimal response
        return LoanApplicationCreateResponse.builder()
            .id(savedApplication.getId())
            .loanType(savedApplication.getLoanType().toString())
            .requestedAmount(savedApplication.getRequestedAmount())
            .tenureMonths(savedApplication.getTenureMonths())
            .status(savedApplication.getStatus().toString())
            .message("✅ Loan application created successfully!")
            .createdAt(savedApplication.getCreatedAt())
            .nextStep("Add Employment & Financial Details")
            .nextStepUrl("/applicant/employment-details?applicationId=" + savedApplication.getId() + "&loanType=" + savedApplication.getLoanType())
            .build();
    }
    
    @Override
    public PersonalDetailsUpdateResponse updatePersonalDetailsFromApplication(UUID applicationId, 
                                                                            ApplicantPersonalDetailsRequest request, User user) {
        log.info("Updating personal details from application context: {}", applicationId);
        
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        validateApplicationOwnership(application, user);
        validateApplicationStatus(application, ApplicationStatus.DRAFT);
        
        // Get existing personal details from the application's user
        ApplicantPersonalDetails personalDetails = personalDetailsRepository
            .findByUserId(application.getApplicant().getId())
            .orElse(new ApplicantPersonalDetails());
        
        // Update personal details with new User-based relationship
        personalDetails.setUser(application.getApplicant());
        // Update name fields
        personalDetails.setFirstName(request.getFirstName());
        personalDetails.setLastName(request.getLastName());
        personalDetails.setMiddleName(request.getMiddleName());
        personalDetails.setDateOfBirth(request.getDateOfBirth());
        personalDetails.setGender(request.getGender().toString());
        personalDetails.setMaritalStatus(request.getMaritalStatus().toString());
        personalDetails.setPanNumber(request.getPanNumber().toUpperCase());
        personalDetails.setAadhaarNumber(request.getAadhaarNumber());
        personalDetails.setFatherName(request.getFatherName());
        personalDetails.setMotherName(request.getMotherName());
        personalDetails.setEmailAddress(application.getApplicantEmail());
        personalDetails.setPhoneNumber(application.getApplicantPhone());
        
        // Current Address - combine address lines
        String currentFullAddress = request.getCurrentAddressLine1();
        if (request.getCurrentAddressLine2() != null && !request.getCurrentAddressLine2().trim().isEmpty()) {
            currentFullAddress += ", " + request.getCurrentAddressLine2();
        }
        personalDetails.setCurrentAddress(currentFullAddress);
        personalDetails.setCurrentCity(request.getCurrentCity());
        personalDetails.setCurrentState(request.getCurrentState());
        personalDetails.setCurrentPincode(request.getCurrentPincode());
        
        // Permanent Address
        if (request.isSameAsCurrent()) {
            personalDetails.setPermanentAddress(currentFullAddress);
            personalDetails.setPermanentCity(request.getCurrentCity());
            personalDetails.setPermanentState(request.getCurrentState());
            personalDetails.setPermanentPincode(request.getCurrentPincode());
            personalDetails.setIsSameAddress(true);
        } else {
            String permanentFullAddress = request.getPermanentAddressLine1();
            if (request.getPermanentAddressLine2() != null && !request.getPermanentAddressLine2().trim().isEmpty()) {
                permanentFullAddress += ", " + request.getPermanentAddressLine2();
            }
            personalDetails.setPermanentAddress(permanentFullAddress);
            personalDetails.setPermanentCity(request.getPermanentCity());
            personalDetails.setPermanentState(request.getPermanentState());
            personalDetails.setPermanentPincode(request.getPermanentPincode());
            personalDetails.setIsSameAddress(false);
        }
        
        personalDetails.setUpdatedAt(LocalDateTime.now());
        personalDetailsRepository.save(personalDetails);
        
        // Update application timestamp
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Audit log
        auditLogService.logAction(user, "PERSONAL_DETAILS_UPDATED", "LoanApplication", null,
            "Personal details updated for application: " + applicationId);
        
        log.info("Personal details updated successfully for application: {}", applicationId);
        
        // Check if application is now complete
        boolean isComplete = isApplicationComplete(applicationId);
        
        return PersonalDetailsUpdateResponse.builder()
            .applicationId(applicationId)
            .message("✅ Personal details updated successfully!")
            .isComplete(isComplete)
            .nextStep(isComplete ? "Submit Application" : "Complete Financial Details")
            .nextStepUrl(isComplete ? 
                "/applicant/employment-details?applicationId=" + applicationId : 
                "/applicant/employment-details?applicationId=" + applicationId)
            .updatedAt(LocalDateTime.now())
            .build();
    }
    
    @Override
    public FinancialDetailsCreateResponse createFinancialDetailsForApplication(UUID applicationId, 
                                                                             ApplicantFinancialDetailsRequest request, User user) {
        log.info("Creating financial details for application: {}", applicationId);
        
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        validateApplicationOwnership(application, user);
        validateApplicationStatus(application, ApplicationStatus.DRAFT);
        
        // Check if financial profile already exists
        if (financialProfileRepository.findByLoanApplicationId(applicationId).isPresent()) {
            throw new LoanApiException("Financial details already exist for this application. Use PUT to update.");
        }
        
        // Create new financial profile
        ApplicantFinancialProfile financialProfile = new ApplicantFinancialProfile();
        financialProfile.setLoanApplication(application);
        
        // Set employment details
        financialProfile.setEmployerName(request.getCompanyName());
        financialProfile.setDesignation(request.getJobTitle());
        financialProfile.setEmploymentType(request.getEmploymentType());
        financialProfile.setEmploymentStartDate(request.getEmploymentStartDate());
        financialProfile.setWorkAddress(request.getCompanyAddress());
        financialProfile.setWorkCity(request.getCompanyCity());
        financialProfile.setWorkPhone(request.getWorkPhone());
        financialProfile.setWorkEmail(request.getWorkEmail());
        
        // Set company contact details
        financialProfile.setHrPhone(request.getHrPhone());
        financialProfile.setHrEmail(request.getHrEmail());
        financialProfile.setManagerName(request.getManagerName());
        financialProfile.setManagerPhone(request.getManagerPhone());
        // Store state and pincode in companyAddress field (since no separate columns exist)
        if (request.getCompanyState() != null || request.getCompanyPincode() != null) {
            String fullAddress = request.getCompanyAddress();
            if (request.getCompanyState() != null) {
                fullAddress += ", " + request.getCompanyState();
            }
            if (request.getCompanyPincode() != null) {
                fullAddress += " - " + request.getCompanyPincode();
            }
            financialProfile.setCompanyAddress(fullAddress);
        }
        
        // Set income details
        financialProfile.setIncomeType(request.getIncomeType());
        financialProfile.setPrimaryMonthlyIncome(request.getMonthlyIncome());
        financialProfile.setSecondaryIncome(request.getAdditionalIncome());
        financialProfile.setExistingEmiAmount(request.getExistingLoanEmi());
        financialProfile.setCreditCardOutstanding(request.getCreditCardOutstanding());
        financialProfile.setMonthlyExpenses(request.getMonthlyExpenses());
        
        // Set banking details
        financialProfile.setPrimaryBankName(request.getBankName());
        financialProfile.setPrimaryAccountNumber(request.getAccountNumber());
        financialProfile.setIfscCode(request.getIfscCode());
        financialProfile.setAccountType(request.getAccountType());
        financialProfile.setBranchName(request.getBranchName());
        financialProfile.setCurrentBankBalance(request.getBankAccountBalance());
        
        financialProfile.setCreatedAt(LocalDateTime.now());
        financialProfile.setUpdatedAt(LocalDateTime.now());
        ApplicantFinancialProfile savedProfile = financialProfileRepository.save(financialProfile);
        
        // Handle employment type specific details
        handleEmploymentTypeSpecificDetails(savedProfile, request);
        
        // Update application timestamp
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Audit log
        auditLogService.logAction(user, "FINANCIAL_DETAILS_CREATED", "LoanApplication", null,
            "Financial details created for application: " + applicationId);
        
        log.info("Financial details created successfully for application: {}", applicationId);
        
        return FinancialDetailsCreateResponse.builder()
            .applicationId(applicationId)
            .message("✅ Financial details created successfully!")
            .isComplete(false) // Always false until documents are uploaded
            .nextStep("Upload Required Documents")
            .nextStepUrl("/applicant/document-upload?applicationId=" + applicationId)
            .updatedAt(savedProfile.getUpdatedAt())
            .build();
    }
    
    @Override
    public FinancialDetailsCreateResponse updateFinancialDetailsForApplication(UUID applicationId, 
                                                                             ApplicantFinancialDetailsRequest request, User user) {
        log.info("Updating financial details for application: {}", applicationId);
        
        LoanApplication application = getLoanApplicationEntityById(applicationId);
        validateApplicationOwnership(application, user);
        validateApplicationStatus(application, ApplicationStatus.DRAFT);
        
        // Get existing financial profile
        ApplicantFinancialProfile financialProfile = financialProfileRepository
            .findByLoanApplicationId(applicationId)
            .orElseThrow(() -> new LoanApiException("Financial details not found for application: " + applicationId + ". Use POST to create."));
        
        // Update employment details
        financialProfile.setEmployerName(request.getCompanyName());
        financialProfile.setDesignation(request.getJobTitle());
        financialProfile.setEmploymentType(request.getEmploymentType());
        financialProfile.setEmploymentStartDate(request.getEmploymentStartDate());
        financialProfile.setWorkAddress(request.getCompanyAddress());
        financialProfile.setWorkCity(request.getCompanyCity());
        financialProfile.setWorkPhone(request.getWorkPhone());
        financialProfile.setWorkEmail(request.getWorkEmail());
        
        // Update company contact details
        financialProfile.setHrPhone(request.getHrPhone());
        financialProfile.setHrEmail(request.getHrEmail());
        financialProfile.setManagerName(request.getManagerName());
        financialProfile.setManagerPhone(request.getManagerPhone());
        // Store state and pincode in companyAddress field (since no separate columns exist)
        if (request.getCompanyState() != null || request.getCompanyPincode() != null) {
            String fullAddress = request.getCompanyAddress();
            if (request.getCompanyState() != null) {
                fullAddress += ", " + request.getCompanyState();
            }
            if (request.getCompanyPincode() != null) {
                fullAddress += " - " + request.getCompanyPincode();
            }
            financialProfile.setCompanyAddress(fullAddress);
        }
        
        // Update income details
        financialProfile.setIncomeType(request.getIncomeType());
        financialProfile.setPrimaryMonthlyIncome(request.getMonthlyIncome());
        financialProfile.setSecondaryIncome(request.getAdditionalIncome());
        financialProfile.setExistingEmiAmount(request.getExistingLoanEmi());
        financialProfile.setCreditCardOutstanding(request.getCreditCardOutstanding());
        financialProfile.setMonthlyExpenses(request.getMonthlyExpenses());
        
        // Update banking details
        financialProfile.setPrimaryBankName(request.getBankName());
        financialProfile.setPrimaryAccountNumber(request.getAccountNumber());
        financialProfile.setIfscCode(request.getIfscCode());
        financialProfile.setAccountType(request.getAccountType());
        financialProfile.setBranchName(request.getBranchName());
        financialProfile.setCurrentBankBalance(request.getBankAccountBalance());
        
        financialProfile.setUpdatedAt(LocalDateTime.now());
        
        // Clear existing employment type specific details before updating
        clearEmploymentTypeSpecificDetails(financialProfile);
        
        ApplicantFinancialProfile savedProfile = financialProfileRepository.save(financialProfile);
        
        // Handle new employment type specific details
        handleEmploymentTypeSpecificDetails(savedProfile, request);
        
        // Update application timestamp
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Audit log
        auditLogService.logAction(user, "FINANCIAL_DETAILS_UPDATED", "LoanApplication", null,
            "Financial details updated for application: " + applicationId);
        
        log.info("Financial details updated successfully for application: {}", applicationId);
        
        return FinancialDetailsCreateResponse.builder()
            .applicationId(applicationId)
            .message("✅ Financial details updated successfully!")
            .isComplete(false) // Check if documents are uploaded
            .nextStep("Upload Required Documents")
            .nextStepUrl("/applicant/document-upload?applicationId=" + applicationId)
            .updatedAt(savedProfile.getUpdatedAt())
            .build();
    }
    
    @Override
    public com.tss.loan.dto.response.ApplicantResubmissionRequirementsResponse getResubmissionRequirements(UUID applicationId, User user) {
        log.info("Getting resubmission requirements for application: {} by user: {}", applicationId, user.getEmail());
        
        try {
        
        // Get application and validate ownership
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        if (!application.getApplicant().getId().equals(user.getId())) {
            throw new LoanApiException("You can only view your own applications");
        }
        
        // Get all documents for the application
        List<com.tss.loan.entity.loan.LoanDocument> documents = documentRepository.findByLoanApplicationIdOrderByUploadedAtDesc(applicationId);
        
        // Get all required document types (you may want to make this configurable)
        com.tss.loan.entity.enums.DocumentType[] requiredDocTypes = com.tss.loan.entity.enums.DocumentType.values();
        
        List<com.tss.loan.dto.response.ApplicantResubmissionRequirementsResponse.DocumentRequirement> documentRequirements = 
            java.util.Arrays.stream(requiredDocTypes)
                .map(docType -> {
                    // Find the latest document of this type
                    com.tss.loan.entity.loan.LoanDocument latestDoc = documents.stream()
                        .filter(doc -> doc.getDocumentType() == docType)
                        .findFirst()
                        .orElse(null);
                    
                    String status;
                    boolean canReupload;
                    String rejectionReason = null;
                    String fileName = null;
                    Long documentId = null;
                    LocalDateTime lastUploadedAt = null;
                    
                    if (latestDoc == null) {
                        status = "MISSING";
                        canReupload = true;
                    } else {
                        documentId = latestDoc.getId();
                        fileName = latestDoc.getFileName();
                        lastUploadedAt = latestDoc.getUploadedAt();
                        
                        com.tss.loan.entity.enums.VerificationStatus verificationStatus = latestDoc.getVerificationStatus();
                        if (verificationStatus == null) {
                            status = "PENDING";
                            canReupload = true;
                        } else {
                            switch (verificationStatus) {
                                case VERIFIED:
                                    status = "VERIFIED";
                                    canReupload = false; // Cannot reupload verified documents
                                    break;
                                case REJECTED:
                                    status = "REJECTED";
                                    canReupload = true;
                                    rejectionReason = latestDoc.getVerificationNotes();
                                    break;
                                case PENDING:
                                default:
                                    status = "PENDING";
                                    canReupload = true; // Can reupload pending documents
                                    break;
                            }
                        }
                    }
                    
                    return com.tss.loan.dto.response.ApplicantResubmissionRequirementsResponse.DocumentRequirement.builder()
                        .documentType(docType.toString())
                        .documentTypeName(getDocumentTypeName(docType))
                        .currentStatus(status)
                        .canReupload(canReupload)
                        .rejectionReason(rejectionReason)
                        .requiredAction(status.equals("REJECTED") ? "RESUBMIT_RECENT" : "UPLOAD")
                        .specificInstructions(getDocumentInstructions(docType))
                        .isRequired(true) // All document types are required for now
                        .lastUploadedAt(lastUploadedAt)
                        .fileName(fileName)
                        .currentDocumentId(documentId)
                        .build();
                })
                .collect(java.util.stream.Collectors.toList());
        
        // Count statistics
        long verifiedCount = documentRequirements.stream()
            .filter(req -> "VERIFIED".equals(req.getCurrentStatus()))
            .count();
        
        boolean hasResubmissionRequirements = application.getStatus() == ApplicationStatus.DOCUMENT_INCOMPLETE ||
            documentRequirements.stream().anyMatch(req -> req.getCanReupload() && 
                ("REJECTED".equals(req.getCurrentStatus()) || "MISSING".equals(req.getCurrentStatus())));
        
        return com.tss.loan.dto.response.ApplicantResubmissionRequirementsResponse.builder()
            .applicationId(applicationId)
            .applicationStatus(application.getStatus().toString())
            .hasResubmissionRequirements(hasResubmissionRequirements)
            .resubmissionDeadline(null) // You may want to store this in the application
            .additionalInstructions("Please upload clear, recent documents. Verified documents cannot be changed.")
            .documentRequirements(documentRequirements)
            .requestedAt(LocalDateTime.now())
            .requestedByOfficer(application.getAssignedOfficer() != null ? application.getAssignedOfficer().getEmail() : null)
            .totalDocumentsRequired(documentRequirements.size())
            .documentsAlreadyVerified((int) verifiedCount)
            .build();
            
        } catch (Exception e) {
            log.error("Error getting resubmission requirements for application: {} by user: {}", applicationId, user.getEmail(), e);
            throw new LoanApiException("Failed to get resubmission requirements: " + e.getMessage());
        }
    }
    
    private String getDocumentTypeName(com.tss.loan.entity.enums.DocumentType docType) {
        if (docType == null) {
            return "Unknown Document";
        }
        switch (docType) {
            case PAN_CARD: return "PAN Card";
            case AADHAAR_CARD: return "Aadhaar Card";
            case SALARY_SLIP: return "Salary Slip";
            case BANK_STATEMENT: return "Bank Statement";
            case EMPLOYMENT_CERTIFICATE: return "Employment Certificate";
            default: return docType.toString().replace("_", " ");
        }
    }
    
    private String getDocumentInstructions(com.tss.loan.entity.enums.DocumentType docType) {
        if (docType == null) {
            return "Upload clear, recent document";
        }
        switch (docType) {
            case PAN_CARD: return "Upload clear photo of PAN card (both sides if applicable)";
            case AADHAAR_CARD: return "Upload clear photo of Aadhaar card (both sides)";
            case SALARY_SLIP: return "Upload latest 3 months salary slips";
            case BANK_STATEMENT: return "Upload latest 6 months bank statements";
            case EMPLOYMENT_CERTIFICATE: return "Upload employment certificate or offer letter";
            default: return "Upload clear, recent document";
        }
    }
    
    /**
     * Clear existing employment type specific details
     * Called when updating to prevent orphaned records
     */
    private void clearEmploymentTypeSpecificDetails(ApplicantFinancialProfile financialProfile) {
        financialProfile.setProfessionalDetails(null);
        financialProfile.setFreelancerDetails(null);
        financialProfile.setRetiredDetails(null);
        financialProfile.setStudentDetails(null);
    }
    
    /**
     * Handle employment type specific details
     * Creates and saves type-specific employment details based on employment type
     */
    private void handleEmploymentTypeSpecificDetails(ApplicantFinancialProfile financialProfile, 
                                                     ApplicantFinancialDetailsRequest request) {
        EmploymentType empType = request.getEmploymentType();
        
        if (empType == null) {
            return; // No type-specific details needed
        }
        
        switch (empType) {
            case PROFESSIONAL:
                if (request.getProfessionalDetails() != null) {
                    ProfessionalEmploymentDetails profDetails = mapToProfessionalDetails(
                        request.getProfessionalDetails(), financialProfile);
                    financialProfile.setProfessionalDetails(profDetails);
                }
                break;
                
            case FREELANCER:
                if (request.getFreelancerDetails() != null) {
                    FreelancerEmploymentDetails freelanceDetails = mapToFreelancerDetails(
                        request.getFreelancerDetails(), financialProfile);
                    financialProfile.setFreelancerDetails(freelanceDetails);
                }
                break;
                
            case RETIRED:
                if (request.getRetiredDetails() != null) {
                    RetiredEmploymentDetails retiredDetails = mapToRetiredDetails(
                        request.getRetiredDetails(), financialProfile);
                    financialProfile.setRetiredDetails(retiredDetails);
                }
                break;
                
            case STUDENT:
                if (request.getStudentDetails() != null) {
                    StudentEmploymentDetails studentDetails = mapToStudentDetails(
                        request.getStudentDetails(), financialProfile);
                    financialProfile.setStudentDetails(studentDetails);
                }
                break;
                
            default:
                // SALARIED, SELF_EMPLOYED, BUSINESS_OWNER, UNEMPLOYED don't need additional details
                break;
        }
    }
    
    /**
     * Map ProfessionalEmploymentDetailsRequest to entity
     */
    private ProfessionalEmploymentDetails mapToProfessionalDetails(
            ProfessionalEmploymentDetailsRequest request, ApplicantFinancialProfile profile) {
        ProfessionalEmploymentDetails details = new ProfessionalEmploymentDetails();
        details.setFinancialProfile(profile);
        details.setProfessionType(request.getProfessionType());
        details.setRegistrationNumber(request.getRegistrationNumber());
        details.setRegistrationAuthority(request.getRegistrationAuthority());
        details.setProfessionalQualification(request.getProfessionalQualification());
        details.setUniversity(request.getUniversity());
        details.setYearOfQualification(request.getYearOfQualification());
        details.setPracticeArea(request.getPracticeArea());
        details.setClinicOrFirmName(request.getClinicOrFirmName());
        details.setClinicOrFirmAddress(request.getClinicOrFirmAddress());
        details.setAdditionalCertifications(request.getAdditionalCertifications());
        return details;
    }
    
    /**
     * Map FreelancerEmploymentDetailsRequest to entity
     */
    private FreelancerEmploymentDetails mapToFreelancerDetails(
            FreelancerEmploymentDetailsRequest request, ApplicantFinancialProfile profile) {
        FreelancerEmploymentDetails details = new FreelancerEmploymentDetails();
        details.setFinancialProfile(profile);
        details.setFreelanceType(request.getFreelanceType());
        details.setFreelanceSince(request.getFreelanceSince());
        details.setPrimaryClients(request.getPrimaryClients());
        details.setAverageMonthlyIncome(request.getAverageMonthlyIncome());
        details.setPortfolioUrl(request.getPortfolioUrl());
        details.setFreelancePlatform(request.getFreelancePlatform());
        details.setSkillSet(request.getSkillSet());
        details.setProjectTypes(request.getProjectTypes());
        details.setActiveClientsCount(request.getActiveClientsCount());
        details.setPaymentMethods(request.getPaymentMethods());
        return details;
    }
    
    /**
     * Map RetiredEmploymentDetailsRequest to entity
     */
    private RetiredEmploymentDetails mapToRetiredDetails(
            RetiredEmploymentDetailsRequest request, ApplicantFinancialProfile profile) {
        RetiredEmploymentDetails details = new RetiredEmploymentDetails();
        details.setFinancialProfile(profile);
        details.setPensionType(request.getPensionType());
        details.setPensionProvider(request.getPensionProvider());
        details.setPpoNumber(request.getPpoNumber());
        details.setMonthlyPensionAmount(request.getMonthlyPensionAmount());
        details.setRetirementDate(request.getRetirementDate());
        details.setPreviousEmployer(request.getPreviousEmployer());
        details.setPreviousDesignation(request.getPreviousDesignation());
        details.setYearsOfService(request.getYearsOfService());
        details.setPensionAccountNumber(request.getPensionAccountNumber());
        details.setPensionBankName(request.getPensionBankName());
        details.setAdditionalRetirementBenefits(request.getAdditionalRetirementBenefits());
        details.setGratuityAmount(request.getGratuityAmount());
        return details;
    }
    
    /**
     * Map StudentEmploymentDetailsRequest to entity
     */
    private StudentEmploymentDetails mapToStudentDetails(
            StudentEmploymentDetailsRequest request, ApplicantFinancialProfile profile) {
        StudentEmploymentDetails details = new StudentEmploymentDetails();
        details.setFinancialProfile(profile);
        
        // Education details
        details.setInstitutionName(request.getInstitutionName());
        details.setInstitutionAddress(request.getInstitutionAddress());
        details.setInstitutionCity(request.getInstitutionCity());
        details.setInstitutionState(request.getInstitutionState());
        details.setCourseName(request.getCourseName());
        details.setSpecialization(request.getSpecialization());
        details.setYearOfStudy(request.getYearOfStudy());
        details.setTotalCourseDuration(request.getTotalCourseDuration());
        details.setExpectedGraduationYear(request.getExpectedGraduationYear());
        details.setStudentIdNumber(request.getStudentIdNumber());
        details.setCurrentCGPA(request.getCurrentCGPA());
        
        // Guardian details
        details.setGuardianName(request.getGuardianName());
        details.setGuardianRelation(request.getGuardianRelation());
        details.setGuardianOccupation(request.getGuardianOccupation());
        details.setGuardianEmployer(request.getGuardianEmployer());
        details.setGuardianDesignation(request.getGuardianDesignation());
        details.setGuardianMonthlyIncome(request.getGuardianMonthlyIncome());
        details.setGuardianAnnualIncome(request.getGuardianAnnualIncome());
        details.setGuardianContact(request.getGuardianContact());
        details.setGuardianEmail(request.getGuardianEmail());
        details.setGuardianAddress(request.getGuardianAddress());
        details.setGuardianCity(request.getGuardianCity());
        details.setGuardianState(request.getGuardianState());
        details.setGuardianPincode(request.getGuardianPincode());
        details.setGuardianPanNumber(request.getGuardianPanNumber());
        details.setGuardianAadharNumber(request.getGuardianAadharNumber());
        
        // Financial support
        details.setScholarshipAmount(request.getScholarshipAmount());
        details.setScholarshipProvider(request.getScholarshipProvider());
        details.setFamilySavingsForEducation(request.getFamilySavingsForEducation());
        details.setAdditionalFinancialSupport(request.getAdditionalFinancialSupport());
        
        return details;
    }
}
