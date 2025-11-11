package com.tss.loan.controller.admin;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.loan.dto.request.OfficerCreationRequest;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.OfficerDetailsResponse;
import com.tss.loan.dto.response.UserResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.officer.OfficerPersonalDetails;
import com.tss.loan.entity.user.User;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.mapper.OfficerMapper;
import com.tss.loan.mapper.UserMapper;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.OfficerPersonalDetailsRepository;
import com.tss.loan.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private OfficerMapper officerMapper;
    
    @Autowired
    private OfficerPersonalDetailsRepository officerPersonalDetailsRepository;
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private LoanApplicationMapper loanApplicationMapper;
    
    @Autowired
    private com.tss.loan.service.AdminService adminService;
    
    /**
     * Get Admin Dashboard Statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<java.util.Map<String, Object>> getAdminDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStatistics());
    }
    
    /**
     * Get Recent Activities
     */
    @GetMapping("/recent-activities")
    public ResponseEntity<List<java.util.Map<String, Object>>> getRecentActivities() {
        return ResponseEntity.ok(adminService.getRecentActivities());
    }
    
    /**
     * Get Recent Applications (Last 5 for dashboard)
     */
    @GetMapping("/recent-applications")
    public ResponseEntity<List<com.tss.loan.dto.response.LoanApplicationResponse>> getRecentApplications() {
        return ResponseEntity.ok(adminService.getRecentApplications());
    }
    
    /**
     * Get All Applications (for "View All" page)
     */
    @GetMapping("/applications")
    public ResponseEntity<List<com.tss.loan.dto.response.LoanApplicationResponse>> getAllApplications() {
        return ResponseEntity.ok(adminService.getAllApplications());
    }
    
    /**
     * Get Application Details (Read-only for admin)
     */
    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<com.tss.loan.dto.response.CompleteApplicationDetailsResponse> getApplicationDetails(
            @PathVariable java.util.UUID applicationId) {
        return ResponseEntity.ok(adminService.getApplicationDetails(applicationId));
    }
    
    /**
     * Create Officer Account
     */
    @PostMapping("/create-officer")
    public ResponseEntity<String> createOfficer(@Valid @RequestBody OfficerCreationRequest request, 
                                              Authentication authentication) {
        log.info("Officer creation request received for email: {}", request.getEmail());
        
        // Get admin user by email from UserDetails
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User admin = userService.findByEmail(userDetails.getUsername());
        User officer = userService.createOfficer(request, admin);
        
        log.info("Officer created successfully with ID: {}", officer.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body("Officer account created successfully. Credentials sent to email: " + request.getEmail());
    }
    
    /**
     * Get All Officers
     */
    @GetMapping("/officers")
    public ResponseEntity<List<UserResponse>> getAllOfficers() {
        log.info("Fetching all officers");
        
        List<User> officers = userService.findAllOfficers();
        
        // ✅ FIXED: Convert to DTOs to prevent circular reference
        List<UserResponse> officerResponses = officers.stream()
            .map(userMapper::toResponse)
            .collect(Collectors.toList());
        
        log.info("Found {} officers", officers.size());
        return ResponseEntity.ok(officerResponses);
    }
    
    /**
     * Get All Users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        log.info("🔍 AdminController.getAllUsers() called - NEW ENDPOINT WORKING!");
        
        try {
            List<User> users = userService.findAllUsers();
            log.info("✅ Found {} users in database", users.size());
            
            // Convert to DTOs to prevent circular reference
            List<UserResponse> userResponses = users.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
            
            log.info("✅ Successfully converted {} users to DTOs", userResponses.size());
            return ResponseEntity.ok(userResponses);
            
        } catch (Exception e) {
            log.error("❌ Error in getAllUsers(): ", e);
            throw e;
        }
    }
    
    /**
     * Get Officer Details by ID (Comprehensive)
     */
    @GetMapping("/officers/{officerId}")
    public ResponseEntity<OfficerDetailsResponse> getOfficerById(@PathVariable String officerId) {
        log.info("Fetching comprehensive officer details for ID: {}", officerId);
        
        try {
            UUID officerUuid = UUID.fromString(officerId);
            User officer = userService.findById(officerUuid);
            
            // Verify the user is an officer
            String role = officer.getRole().name();
            if (!role.contains("OFFICER")) {
                log.warn("User {} is not an officer, role: {}", officerId, officer.getRole());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            // Fetch officer personal details
            OfficerPersonalDetails personalDetails = officerPersonalDetailsRepository
                .findByUserId(officerUuid)
                .orElse(null);
            
            if (personalDetails == null) {
                log.warn("No personal details found for officer ID: {}", officerId);
            }
            
            // Map to comprehensive response
            OfficerDetailsResponse response = officerMapper.toDetailsResponse(officer, personalDetails);
            
            log.info("Successfully fetched comprehensive officer details for ID: {}", officerId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for officer ID: {}", officerId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error fetching officer details for ID: {}", officerId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    /**
     * Get Officer's Assigned Applications
     */
    @GetMapping("/officers/{officerId}/applications")
    public ResponseEntity<List<LoanApplicationResponse>> getOfficerAssignedApplications(@PathVariable String officerId) {
        log.info("Fetching assigned applications for officer ID: {}", officerId);
        
        try {
            UUID officerUuid = UUID.fromString(officerId);
            
            // Fetch all applications assigned to this officer
            List<LoanApplication> applications = loanApplicationRepository
                .findByAssignedOfficerIdOrderByCreatedAtDesc(officerUuid);
            
            // Map to response DTOs
            List<LoanApplicationResponse> responses = applications.stream()
                .map(loanApplicationMapper::toResponse)
                .collect(Collectors.toList());
            
            log.info("Found {} assigned applications for officer ID: {}", responses.size(), officerId);
            return ResponseEntity.ok(responses);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for officer ID: {}", officerId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error fetching assigned applications for officer ID: {}", officerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Toggle Officer Status (Soft Delete with validation)
     */
    @PostMapping("/officers/{officerId}/toggle-status")
    public ResponseEntity<String> toggleOfficerStatus(@PathVariable String officerId) {
        log.info("Request to toggle status for officer ID: {}", officerId);
        
        try {
            UUID officerUuid = UUID.fromString(officerId);
            User officer = userService.findById(officerUuid);
            
            // Verify the user is an officer
            String role = officer.getRole().name();
            if (!role.contains("OFFICER")) {
                log.warn("User {} is not an officer, role: {}", officerId, officer.getRole());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("User is not an officer");
            }
            
            // If trying to deactivate, check for active applications
            if ("ACTIVE".equals(officer.getStatus().name())) {
                // Get all applications assigned to this officer
                List<LoanApplication> assignedApplications = loanApplicationRepository
                    .findByAssignedOfficerIdOrderByCreatedAtDesc(officerUuid);
                
                // Check if any applications are in active/pending status
                long activeApplicationsCount = assignedApplications.stream()
                    .filter(app -> {
                        String status = app.getStatus().name();
                        return !status.equals("APPROVED") && 
                               !status.equals("REJECTED") && 
                               !status.equals("CANCELLED") &&
                               !status.equals("EXPIRED") &&
                               !status.equals("DISBURSED");
                    })
                    .count();
                
                if (activeApplicationsCount > 0) {
                    log.warn("Cannot deactivate officer {} - has {} active applications", 
                        officerId, activeApplicationsCount);
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Cannot deactivate officer. Officer has " + activeApplicationsCount + 
                              " active/pending applications. Please reassign or complete them first.");
                }
            }
            
            // Toggle status
            if ("ACTIVE".equals(officer.getStatus().name())) {
                officer.setStatus(com.tss.loan.entity.enums.UserStatus.INACTIVE);
                log.info("Deactivating officer ID: {}", officerId);
            } else {
                officer.setStatus(com.tss.loan.entity.enums.UserStatus.ACTIVE);
                log.info("Activating officer ID: {}", officerId);
            }
            
            userService.updateUser(officer);
            
            String message = "ACTIVE".equals(officer.getStatus().name()) ? 
                "Officer activated successfully" : "Officer deactivated successfully";
            
            return ResponseEntity.ok(message);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for officer ID: {}", officerId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Invalid officer ID format");
        } catch (Exception e) {
            log.error("Error toggling officer status for ID: {}", officerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error toggling officer status: " + e.getMessage());
        }
    }
    
    /**
     * Get Applicant Details by ID
     */
    @GetMapping("/applicants/{applicantId}")
    public ResponseEntity<UserResponse> getApplicantById(@PathVariable String applicantId) {
        log.info("Fetching applicant details for ID: {}", applicantId);
        
        try {
            UUID applicantUuid = UUID.fromString(applicantId);
            User applicant = userService.findById(applicantUuid);
            
            // Verify the user is an applicant
            if (!"APPLICANT".equals(applicant.getRole().name())) {
                log.warn("User {} is not an applicant, role: {}", applicantId, applicant.getRole());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            UserResponse response = userMapper.toResponse(applicant);
            log.info("Successfully fetched applicant details for ID: {}", applicantId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for applicant ID: {}", applicantId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error fetching applicant details for ID: {}", applicantId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        log.info("🧪 Test endpoint called - AdminController is working!");
        return ResponseEntity.ok("AdminController is working! Time: " + java.time.LocalDateTime.now());
    }
}
