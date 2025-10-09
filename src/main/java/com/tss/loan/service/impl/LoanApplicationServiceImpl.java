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
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.entity.financial.ApplicantFinancialProfile;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.ApplicantFinancialProfileRepository;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.LoanDocumentRepository;
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
            "Loan Application Created",
            "Your loan application has been created successfully. Please complete all sections to submit.",
            "LOAN_APPLICATION"
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
        
        // Create notification
        notificationService.createNotification(
            user,
            "Loan Application Submitted",
            "Your loan application has been submitted successfully and is under review.",
            "LOAN_APPLICATION"
        );
        
        // Audit log
        auditLogService.logAction(user, "LOAN_APPLICATION_SUBMITTED", "LoanApplication", null,
            "Loan application submitted: " + applicationId);
        
        log.info("Loan application submitted successfully: {}", applicationId);
        return submittedApplication;
    }

    @Override
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
}
