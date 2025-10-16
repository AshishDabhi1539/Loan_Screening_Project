package com.tss.loan.service;

import java.util.Optional;
import java.util.UUID;

import com.tss.loan.dto.request.OfficerPersonalDetailsRequest;
import com.tss.loan.dto.response.OfficerPersonalDetailsResponse;
import com.tss.loan.entity.user.User;

/**
 * Service interface for officer profile management and name resolution
 */
public interface OfficerProfileService {
    
    /**
     * Create or update officer personal details
     * @param request the officer personal details request
     * @param user the user entity
     * @return saved officer personal details response
     */
    OfficerPersonalDetailsResponse createOrUpdateOfficerDetails(OfficerPersonalDetailsRequest request, User user);
    
    /**
     * Get officer personal details by user ID
     * @param userId the user ID
     * @return optional officer personal details response
     */
    Optional<OfficerPersonalDetailsResponse> getOfficerDetailsByUserId(UUID userId);
    
    /**
     * Get officer personal details by user entity
     * @param user the user entity
     * @return optional officer personal details response
     */
    Optional<OfficerPersonalDetailsResponse> getOfficerDetailsByUser(User user);
    
    /**
     * Check if officer has personal details
     * @param user the user entity
     * @return true if officer has personal details, false otherwise
     */
    boolean hasOfficerDetails(User user);
    
    /**
     * Get display name for officer (smart name resolution)
     * Priority: OfficerPersonalDetails.fullName > User.email
     * @param user the user entity
     * @return display name
     */
    String getOfficerDisplayName(User user);
    
    /**
     * Get short display name for officer
     * @param user the user entity
     * @return short display name
     */
    String getOfficerShortDisplayName(User user);
    
    /**
     * Get display name with title/designation
     * @param user the user entity
     * @return display name with title
     */
    String getOfficerDisplayNameWithTitle(User user);
    
    /**
     * Check if officer can perform compliance operations
     * @param user the user entity
     * @return true if officer can perform compliance operations
     */
    boolean canPerformComplianceOperations(User user);
    
    /**
     * Check if officer can perform loan operations
     * @param user the user entity
     * @return true if officer can perform loan operations
     */
    boolean canPerformLoanOperations(User user);
    
    /**
     * Get officer's department
     * @param user the user entity
     * @return department name or null
     */
    String getOfficerDepartment(User user);
    
    /**
     * Get officer's designation
     * @param user the user entity
     * @return designation or null
     */
    String getOfficerDesignation(User user);
    
    /**
     * Get officer's employee ID
     * @param user the user entity
     * @return employee ID or null
     */
    String getOfficerEmployeeId(User user);
    
    /**
     * Generate unique employee ID for officer
     * @param role the officer role
     * @param department the department (optional)
     * @return generated unique employee ID
     */
    String generateEmployeeId(com.tss.loan.entity.enums.RoleType role, String department);
    
    /**
     * Check if employee ID already exists
     * @param employeeId the employee ID to check
     * @return true if exists, false otherwise
     */
    boolean employeeIdExists(String employeeId);
}
