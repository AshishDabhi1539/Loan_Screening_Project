package com.tss.loan.service;

import java.util.Optional;

import com.tss.loan.dto.response.ProfileStatusResponse;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.user.User;

public interface ProfileCompletionService {
    
    /**
     * Check if user has completed personal details
     */
    boolean hasPersonalDetails(User user);
    
    /**
     * Get user's display name with fallback
     * Priority: PersonalDetails.fullName > User.email
     */
    String getDisplayName(User user);
    
    /**
     * Get personal details for user (if exists)
     */
    Optional<ApplicantPersonalDetails> getPersonalDetails(User user);
    
    /**
     * Check if user can proceed with loan application
     */
    boolean canApplyForLoan(User user);
    
    /**
     * Get profile status with detailed message
     */
    ProfileStatusResponse getProfileStatus(User user);
}
