package com.tss.loan.service.impl;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.service.ProfileCompletionService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ProfileCompletionServiceImpl implements ProfileCompletionService {
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    @Override
    public boolean hasPersonalDetails(User user) {
        return personalDetailsRepository.existsByUserId(user.getId());
    }
    
    @Override
    public String getDisplayName(User user) {
        // Priority: PersonalDetails.fullName > User.email
        Optional<ApplicantPersonalDetails> details = getPersonalDetails(user);
        if (details.isPresent()) {
            return details.get().getFullName();
        }
        return user.getEmail(); // Fallback to email
    }
    
    @Override
    public Optional<ApplicantPersonalDetails> getPersonalDetails(User user) {
        return personalDetailsRepository.findByUserId(user.getId());
    }
    
    @Override
    public boolean canApplyForLoan(User user) {
        // User must have personal details and be active/verified to apply for loan
        return hasPersonalDetails(user) && user.isActive() && user.isVerified();
    }
}
