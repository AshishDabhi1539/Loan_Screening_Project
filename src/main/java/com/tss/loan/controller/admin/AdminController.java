package com.tss.loan.controller.admin;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
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
}
