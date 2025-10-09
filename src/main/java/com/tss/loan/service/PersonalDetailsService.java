package com.tss.loan.service;

import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
import com.tss.loan.dto.response.PersonalDetailsCreateResponse;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.user.User;

public interface PersonalDetailsService {
    
    /**
     * Create or update personal details for user
     */
    ApplicantPersonalDetails createOrUpdatePersonalDetails(ApplicantPersonalDetailsRequest request, User user);
    
    /**
     * Get personal details for user
     */
    ApplicantPersonalDetails getPersonalDetailsByUser(User user);
    
    /**
     * Create or update personal details with response DTO
     */
    PersonalDetailsCreateResponse createOrUpdatePersonalDetailsWithResponse(ApplicantPersonalDetailsRequest request, User user);
}
