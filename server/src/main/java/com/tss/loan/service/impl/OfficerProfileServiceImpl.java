package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.request.OfficerPersonalDetailsRequest;
import com.tss.loan.dto.response.OfficerPersonalDetailsResponse;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.officer.OfficerPersonalDetails;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.OfficerPersonalDetailsRepository;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.OfficerProfileService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of OfficerProfileService for officer profile management and name resolution
 */
@Service
@Slf4j
@Transactional
public class OfficerProfileServiceImpl implements OfficerProfileService {
    
    @Autowired
    private OfficerPersonalDetailsRepository officerPersonalDetailsRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    private final Random random = new Random();
    
    @Override
    public OfficerPersonalDetailsResponse createOrUpdateOfficerDetails(OfficerPersonalDetailsRequest request, User user) {
        log.info("Creating/updating officer personal details for user: {}", user.getEmail());
        
        // Validate user is an officer
        if (!isOfficerRole(user.getRole())) {
            throw new LoanApiException("Only officers can have officer personal details");
        }
        
        // Find existing or create new
        OfficerPersonalDetails officerDetails = officerPersonalDetailsRepository.findByUser(user)
            .orElse(new OfficerPersonalDetails());
        
        boolean isNew = officerDetails.getId() == null;
        
        // Update fields
        officerDetails.setUser(user);
        officerDetails.setFirstName(request.getFirstName());
        officerDetails.setLastName(request.getLastName());
        officerDetails.setMiddleName(request.getMiddleName());
        
        // Auto-generate employee ID for new officers
        if (isNew || officerDetails.getEmployeeId() == null || officerDetails.getEmployeeId().trim().isEmpty()) {
            String generatedEmployeeId = generateEmployeeId(user.getRole(), request.getDepartment());
            officerDetails.setEmployeeId(generatedEmployeeId);
            log.info("Generated employee ID: {} for officer: {}", generatedEmployeeId, user.getEmail());
        }
        officerDetails.setDepartment(request.getDepartment());
        officerDetails.setDesignation(request.getDesignation());
        officerDetails.setPhoneNumber(request.getPhoneNumber());
        officerDetails.setWorkLocation(request.getWorkLocation());
        
        // Save
        OfficerPersonalDetails saved = officerPersonalDetailsRepository.save(officerDetails);
        
        // Audit log
        String action = isNew ? "OFFICER_PROFILE_CREATED" : "OFFICER_PROFILE_UPDATED";
        auditLogService.logAction(user, action, "OfficerPersonalDetails", saved.getId(),
            String.format("Officer personal details %s for: %s", isNew ? "created" : "updated", saved.getFullName()));
        
        log.info("Officer personal details {} for user: {} ({})", 
            isNew ? "created" : "updated", user.getEmail(), saved.getFullName());
        
        return mapToResponse(saved);
    }
    
    @Override
    public Optional<OfficerPersonalDetailsResponse> getOfficerDetailsByUserId(UUID userId) {
        return officerPersonalDetailsRepository.findByUserId(userId)
            .map(this::mapToResponse);
    }
    
    @Override
    public Optional<OfficerPersonalDetailsResponse> getOfficerDetailsByUser(User user) {
        return officerPersonalDetailsRepository.findByUser(user)
            .map(this::mapToResponse);
    }
    
    @Override
    public boolean hasOfficerDetails(User user) {
        return officerPersonalDetailsRepository.existsByUserId(user.getId());
    }
    
    @Override
    public String getOfficerDisplayName(User user) {
        // Priority: OfficerPersonalDetails.fullName > User.email
        Optional<OfficerPersonalDetails> details = officerPersonalDetailsRepository.findByUser(user);
        if (details.isPresent()) {
            return details.get().getFullName();
        }
        return user.getEmail(); // Fallback to email
    }
    
    @Override
    public String getOfficerShortDisplayName(User user) {
        Optional<OfficerPersonalDetails> details = officerPersonalDetailsRepository.findByUser(user);
        if (details.isPresent()) {
            return details.get().getShortDisplayName();
        }
        return user.getEmail(); // Fallback to email
    }
    
    @Override
    public String getOfficerDisplayNameWithTitle(User user) {
        Optional<OfficerPersonalDetails> details = officerPersonalDetailsRepository.findByUser(user);
        if (details.isPresent()) {
            return details.get().getDisplayNameWithTitle();
        }
        return user.getEmail(); // Fallback to email
    }
    
    @Override
    public boolean canPerformComplianceOperations(User user) {
        return user.getRole() == RoleType.COMPLIANCE_OFFICER || 
               user.getRole() == RoleType.SENIOR_COMPLIANCE_OFFICER;
    }
    
    @Override
    public boolean canPerformLoanOperations(User user) {
        return user.getRole() == RoleType.LOAN_OFFICER || 
               user.getRole() == RoleType.SENIOR_LOAN_OFFICER;
    }
    
    @Override
    public String getOfficerDepartment(User user) {
        return officerPersonalDetailsRepository.findByUser(user)
            .map(OfficerPersonalDetails::getDepartment)
            .orElse(null);
    }
    
    @Override
    public String getOfficerDesignation(User user) {
        return officerPersonalDetailsRepository.findByUser(user)
            .map(OfficerPersonalDetails::getDesignation)
            .orElse(null);
    }
    
    @Override
    public String getOfficerEmployeeId(User user) {
        return officerPersonalDetailsRepository.findByUser(user)
            .map(OfficerPersonalDetails::getEmployeeId)
            .orElse(null);
    }
    
    @Override
    public String generateEmployeeId(RoleType role, String department) {
        String prefix = getRolePrefix(role);
        String deptCode = getDepartmentCode(department);
        String yearMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMM"));
        
        // Generate unique ID with format: PREFIX-DEPT-YYMM-XXXX
        // Example: LO-CR-2410-1001, CO-FR-2410-2001
        String baseId;
        String employeeId;
        int attempts = 0;
        
        do {
            int sequence = generateSequenceNumber(role);
            baseId = String.format("%s-%s-%s-%04d", prefix, deptCode, yearMonth, sequence);
            employeeId = baseId;
            attempts++;
            
            // If ID exists, try with suffix
            if (employeeIdExists(employeeId) && attempts < 100) {
                employeeId = baseId + "-" + String.format("%02d", attempts);
            }
            
        } while (employeeIdExists(employeeId) && attempts < 100);
        
        if (attempts >= 100) {
            // Fallback to timestamp-based ID
            employeeId = prefix + "-" + System.currentTimeMillis();
            log.warn("Generated fallback employee ID after 100 attempts: {}", employeeId);
        }
        
        log.info("Generated employee ID: {} for role: {} in department: {}", employeeId, role, department);
        return employeeId;
    }
    
    @Override
    public boolean employeeIdExists(String employeeId) {
        return officerPersonalDetailsRepository.existsByEmployeeId(employeeId);
    }
    
    /**
     * Check if user role is an officer role
     */
    private boolean isOfficerRole(RoleType role) {
        return role == RoleType.LOAN_OFFICER || 
               role == RoleType.SENIOR_LOAN_OFFICER ||
               role == RoleType.COMPLIANCE_OFFICER ||
               role == RoleType.SENIOR_COMPLIANCE_OFFICER ||
               role == RoleType.ADMIN;
    }
    
    /**
     * Get role prefix for employee ID
     */
    private String getRolePrefix(RoleType role) {
        switch (role) {
            case LOAN_OFFICER:
                return "LO";
            case SENIOR_LOAN_OFFICER:
                return "SLO";
            case COMPLIANCE_OFFICER:
                return "CO";
            case SENIOR_COMPLIANCE_OFFICER:
                return "SCO";
            case ADMIN:
                return "ADM";
            default:
                return "OFF"; // Generic officer
        }
    }
    
    /**
     * Get department code for employee ID using Department enum
     */
    private String getDepartmentCode(String department) {
        if (department == null || department.trim().isEmpty()) {
            return com.tss.loan.entity.enums.Department.GENERAL.getCode();
        }
        
        // Use Department enum for consistent codes
        com.tss.loan.entity.enums.Department dept = com.tss.loan.entity.enums.Department.fromDisplayName(department);
        return dept.getCode();
    }
    
    /**
     * Generate sequence number based on role
     */
    private int generateSequenceNumber(RoleType role) {
        int baseNumber;
        
        switch (role) {
            case LOAN_OFFICER:
                baseNumber = 1000;
                break;
            case SENIOR_LOAN_OFFICER:
                baseNumber = 1500;
                break;
            case COMPLIANCE_OFFICER:
                baseNumber = 2000;
                break;
            case SENIOR_COMPLIANCE_OFFICER:
                baseNumber = 2500;
                break;
            case ADMIN:
                baseNumber = 9000;
                break;
            default:
                baseNumber = 3000;
        }
        
        // Add random number to avoid collisions
        return baseNumber + random.nextInt(499) + 1; // +1 to +499
    }
    
    /**
     * Map entity to response DTO
     */
    private OfficerPersonalDetailsResponse mapToResponse(OfficerPersonalDetails entity) {
        User user = entity.getUser();
        
        return OfficerPersonalDetailsResponse.builder()
            .id(entity.getId())
            .userId(user.getId())
            .firstName(entity.getFirstName())
            .lastName(entity.getLastName())
            .middleName(entity.getMiddleName())
            .fullName(entity.getFullName())
            .shortDisplayName(entity.getShortDisplayName())
            .displayNameWithTitle(entity.getDisplayNameWithTitle())
            .employeeId(entity.getEmployeeId())
            .department(entity.getDepartment())
            .designation(entity.getDesignation())
            .phoneNumber(entity.getPhoneNumber())
            .workLocation(entity.getWorkLocation())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            // User information
            .email(user.getEmail())
            .role(user.getRole().name())
            .userStatus(user.getStatus().name())
            // Computed fields
            .canPerformLoanOperations(canPerformLoanOperations(user))
            .canPerformComplianceOperations(canPerformComplianceOperations(user))
            .hasCompleteProfile(true) // If entity exists, profile is complete
            .build();
    }
}
