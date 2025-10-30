package com.tss.loan.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
import com.tss.loan.dto.response.PersonalDetailsCreateResponse;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.PersonalDetailsService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class PersonalDetailsServiceImpl implements PersonalDetailsService {
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Override
    public ApplicantPersonalDetails createOrUpdatePersonalDetails(ApplicantPersonalDetailsRequest request, User user) {
        log.info("Creating/updating personal details for user: {}", user.getEmail());
        
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
        
        // Update other personal information
        personalDetails.setDateOfBirth(request.getDateOfBirth());
        personalDetails.setGender(request.getGender().toString());
        personalDetails.setMaritalStatus(request.getMaritalStatus().toString());
        personalDetails.setPanNumber(request.getPanNumber().toUpperCase());
        personalDetails.setAadhaarNumber(request.getAadhaarNumber());
        personalDetails.setFatherName(request.getFatherName());
        personalDetails.setMotherName(request.getMotherName());
        personalDetails.setPhoneNumber(user.getPhone());
        personalDetails.setEmailAddress(user.getEmail());
        
        // Additional optional fields
        personalDetails.setAlternatePhoneNumber(request.getAlternatePhoneNumber());
        personalDetails.setDependentsCount(request.getDependentsCount() != null ? request.getDependentsCount() : 0);
        personalDetails.setSpouseName(request.getSpouseName());
        
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
        if (personalDetails.getCreatedAt() == null) {
            personalDetails.setCreatedAt(LocalDateTime.now());
        }
        
        ApplicantPersonalDetails savedDetails = personalDetailsRepository.save(personalDetails);
        
        // Audit log
        auditLogService.logAction(user, "PERSONAL_DETAILS_UPDATED", "ApplicantPersonalDetails", null,
            "Personal details updated for user: " + user.getEmail());
        
        log.info("Personal details updated successfully for user: {} - {}", user.getEmail(), savedDetails.getFullName());
        return savedDetails;
    }
    
    @Override
    public ApplicantPersonalDetails getPersonalDetailsByUser(User user) {
        return personalDetailsRepository.findByUserId(user.getId())
                .orElseThrow(() -> new LoanApiException("Personal details not found for user: " + user.getEmail()));
    }
    
    @Override
    public PersonalDetailsCreateResponse createOrUpdatePersonalDetailsWithResponse(ApplicantPersonalDetailsRequest request, User user) {
        log.info("Creating/updating personal details with response for user: {}", user.getEmail());
        
        try {
            // Create or update personal details
            ApplicantPersonalDetails savedDetails = createOrUpdatePersonalDetails(request, user);
            
            // Return success response
            return PersonalDetailsCreateResponse.builder()
                .message("✅ Personal details updated successfully! You can now apply for loans.")
                .canApplyForLoan(true)
                .nextAction("Apply for Loan")
                .nextActionUrl("/api/loan-application/create")
                .updatedAt(savedDetails.getUpdatedAt())
                .build();
                
        } catch (Exception e) {
            log.error("Error updating personal details for user {}: {}", user.getEmail(), e.getMessage());
            
            // Return error response
            return PersonalDetailsCreateResponse.builder()
                .message("❌ Error updating personal details: " + e.getMessage())
                .canApplyForLoan(false)
                .nextAction("Retry")
                .nextActionUrl("/api/loan-application/personal-details")
                .updatedAt(LocalDateTime.now())
                .build();
        }
    }
    
    @Override
    public PersonalDetailsCreateResponse getPersonalDetailsForUser(User user) {
        log.info("Getting personal details for user: {}", user.getEmail());
        
        try {
            // Get existing personal details
            ApplicantPersonalDetails details = personalDetailsRepository.findByUserId(user.getId())
                .orElseThrow(() -> new LoanApiException("Personal details not found for user: " + user.getEmail()));
            
            log.info("Found personal details for user: {} - {}", user.getEmail(), details.getFirstName() + " " + details.getLastName());
            
            // Return success response with actual personal details data
            return PersonalDetailsCreateResponse.builder()
                .message("✅ Personal details found successfully!")
                .canApplyForLoan(true)
                .nextAction("Update Details")
                .nextActionUrl("/api/applicant/profile/personal-details")
                .updatedAt(details.getUpdatedAt())
                // Add actual personal details data
                .firstName(details.getFirstName())
                .lastName(details.getLastName())
                .middleName(details.getMiddleName())
                .dateOfBirth(details.getDateOfBirth())
                .gender(details.getGender())
                .maritalStatus(details.getMaritalStatus())
                .fatherName(details.getFatherName())
                .motherName(details.getMotherName())
                .panNumber(details.getPanNumber())
                .aadhaarNumber(details.getAadhaarNumber())
                .currentAddressLine1(details.getCurrentAddress())
                .currentAddressLine2(null) // Entity doesn't have separate line2
                .currentCity(details.getCurrentCity())
                .currentState(details.getCurrentState())
                .currentPincode(details.getCurrentPincode())
                .sameAsCurrent(details.getIsSameAddress())
                .permanentAddressLine1(details.getPermanentAddress())
                .permanentAddressLine2(null) // Entity doesn't have separate line2
                .permanentCity(details.getPermanentCity())
                .permanentState(details.getPermanentState())
                .permanentPincode(details.getPermanentPincode())
                .alternatePhoneNumber(details.getAlternatePhoneNumber())
                .dependentsCount(details.getDependentsCount())
                .spouseName(details.getSpouseName())
                .build();
                
        } catch (Exception e) {
            log.warn("Personal details not found for user {}: {}", user.getEmail(), e.getMessage());
            
            // Return response indicating no data found
            return PersonalDetailsCreateResponse.builder()
                .message("ℹ️ No personal details found. Please complete your profile.")
                .canApplyForLoan(false)
                .nextAction("Complete Profile")
                .nextActionUrl("/api/applicant/profile/personal-details")
                .updatedAt(LocalDateTime.now())
                .build();
        }
    }
}
