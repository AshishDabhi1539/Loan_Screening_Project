package com.tss.loan.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;

/**
 * Service for getting user display information
 * Handles the fact that User entity only has authentication data
 * while personal details are in ApplicantPersonalDetails
 */
@Service
public class UserDisplayService {
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    /**
     * Get display name for user
     * Priority: PersonalDetails.fullName > User.email
     */
    public String getDisplayName(User user) {
        if (user == null) return "Unknown User";
        
        Optional<ApplicantPersonalDetails> personalDetails = 
            personalDetailsRepository.findByUserId(user.getId());
        
        if (personalDetails.isPresent()) {
            return personalDetails.get().getFullName();
        }
        
        // Fallback to email if no personal details
        return user.getEmail();
    }
    
    /**
     * Get first name for user
     */
    public String getFirstName(User user) {
        if (user == null) return "Unknown";
        
        Optional<ApplicantPersonalDetails> personalDetails = 
            personalDetailsRepository.findByUserId(user.getId());
        
        if (personalDetails.isPresent()) {
            return personalDetails.get().getFirstName();
        }
        
        // Fallback to email prefix
        return user.getEmail().split("@")[0];
    }
    
    /**
     * Get last name for user
     */
    public String getLastName(User user) {
        if (user == null) return "";
        
        Optional<ApplicantPersonalDetails> personalDetails = 
            personalDetailsRepository.findByUserId(user.getId());
        
        if (personalDetails.isPresent()) {
            return personalDetails.get().getLastName();
        }
        
        // No fallback for last name
        return "";
    }
    
    /**
     * Check if user has complete personal details
     */
    public boolean hasPersonalDetails(User user) {
        if (user == null) return false;
        return personalDetailsRepository.existsByUserId(user.getId());
    }
}
