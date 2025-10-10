package com.tss.loan.service.impl;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.enums.UserStatus;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.UserRepository;
import com.tss.loan.service.ApplicationAssignmentService;

import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class ApplicationAssignmentServiceImpl implements ApplicationAssignmentService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    // Maximum applications per officer
    private static final int MAX_WORKLOAD_PER_OFFICER = 10;
    
    // High value loan threshold (requires senior officer)
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("1000000.0"); // 10 Lakhs
    
    @Override
    public User assignToLoanOfficer(LoanApplication application) {
        log.info("Auto-assigning application {} to loan officer", application.getId());
        
        User assignedOfficer = getBestAvailableOfficer(application.getRequestedAmount());
        
        if (assignedOfficer == null) {
            log.error("No available loan officer found for application {}", application.getId());
            throw new RuntimeException("No available loan officer found");
        }
        
        // Update application with assigned officer
        application.setAssignedOfficer(assignedOfficer);
        application.setStatus(ApplicationStatus.UNDER_REVIEW);
        loanApplicationRepository.save(application);
        
        log.info("Application {} assigned to officer {} ({})", 
            application.getId(), assignedOfficer.getId(), assignedOfficer.getEmail());
        
        return assignedOfficer;
    }
    
    @Override
    public User getBestAvailableOfficer(BigDecimal requestedAmount) {
        log.debug("Finding best available officer for amount: {}", requestedAmount);
        
        // For high-value loans, prefer senior loan officers
        if (requestedAmount != null && requestedAmount.compareTo(HIGH_VALUE_THRESHOLD) > 0) {
            Optional<User> seniorOfficer = findAvailableSeniorOfficer();
            if (seniorOfficer.isPresent()) {
                log.debug("Assigned senior officer for high-value loan");
                return seniorOfficer.get();
            }
        }
        
        // Find regular loan officer with least workload
        List<User> availableOfficers = userRepository.findByRoleAndStatus(
            RoleType.LOAN_OFFICER, UserStatus.ACTIVE);
        
        return availableOfficers.stream()
            .filter(this::hasCapacity)
            .min(Comparator.comparing(this::getCurrentWorkload))
            .orElse(null);
    }
    
    @Override
    public boolean hasCapacity(User officer) {
        int currentWorkload = getCurrentWorkload(officer);
        boolean hasCapacity = currentWorkload < MAX_WORKLOAD_PER_OFFICER;
        
        log.debug("Officer {} has workload: {}/{}, hasCapacity: {}", 
            officer.getEmail(), currentWorkload, MAX_WORKLOAD_PER_OFFICER, hasCapacity);
        
        return hasCapacity;
    }
    
    @Override
    public int getCurrentWorkload(User officer) {
        // Count applications in UNDER_REVIEW and PENDING_EXTERNAL_VERIFICATION status
        List<ApplicationStatus> activeStatuses = List.of(
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.PENDING_EXTERNAL_VERIFICATION,
            ApplicationStatus.READY_FOR_DECISION
        );
        
        return loanApplicationRepository.countByAssignedOfficerAndStatusIn(officer, activeStatuses);
    }
    
    /**
     * Find available senior loan officer for high-value loans
     */
    private Optional<User> findAvailableSeniorOfficer() {
        List<User> seniorOfficers = userRepository.findByRoleAndStatus(
            RoleType.SENIOR_LOAN_OFFICER, UserStatus.ACTIVE);
        
        return seniorOfficers.stream()
            .filter(this::hasCapacity)
            .min(Comparator.comparing(this::getCurrentWorkload));
    }
}
