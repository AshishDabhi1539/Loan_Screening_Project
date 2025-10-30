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
import com.tss.loan.dto.response.UserResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.mapper.UserMapper;
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
