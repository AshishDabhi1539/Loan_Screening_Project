package com.tss.loan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.officer.OfficerPersonalDetails;
import com.tss.loan.entity.user.User;

/**
 * Repository interface for OfficerPersonalDetails entity
 */
@Repository
public interface OfficerPersonalDetailsRepository extends JpaRepository<OfficerPersonalDetails, Long> {
    
    /**
     * Find officer personal details by user ID
     * @param userId the user ID
     * @return optional officer personal details
     */
    Optional<OfficerPersonalDetails> findByUserId(UUID userId);
    
    /**
     * Find officer personal details by user entity
     * @param user the user entity
     * @return optional officer personal details
     */
    Optional<OfficerPersonalDetails> findByUser(User user);
    
    /**
     * Check if officer personal details exist for a user
     * @param userId the user ID
     * @return true if exists, false otherwise
     */
    boolean existsByUserId(UUID userId);
    
    /**
     * Find officer personal details by employee ID
     * @param employeeId the employee ID
     * @return optional officer personal details
     */
    Optional<OfficerPersonalDetails> findByEmployeeId(String employeeId);
    
    /**
     * Check if employee ID already exists
     * @param employeeId the employee ID
     * @return true if exists, false otherwise
     */
    boolean existsByEmployeeId(String employeeId);
    
    /**
     * Find officers by department
     * @param department the department name
     * @return list of officer personal details
     */
    @Query("SELECT o FROM OfficerPersonalDetails o WHERE o.department = :department")
    java.util.List<OfficerPersonalDetails> findByDepartment(@Param("department") String department);
    
    /**
     * Find officers by work location
     * @param workLocation the work location
     * @return list of officer personal details
     */
    @Query("SELECT o FROM OfficerPersonalDetails o WHERE o.workLocation = :workLocation")
    java.util.List<OfficerPersonalDetails> findByWorkLocation(@Param("workLocation") String workLocation);
    
    /**
     * Search officers by name (first name or last name contains search term)
     * @param searchTerm the search term
     * @return list of matching officer personal details
     */
    @Query("SELECT o FROM OfficerPersonalDetails o WHERE " +
           "LOWER(o.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(o.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    java.util.List<OfficerPersonalDetails> searchByName(@Param("searchTerm") String searchTerm);
}
