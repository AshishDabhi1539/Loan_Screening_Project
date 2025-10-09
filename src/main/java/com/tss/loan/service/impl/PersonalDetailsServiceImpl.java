package com.tss.loan.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
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
}
