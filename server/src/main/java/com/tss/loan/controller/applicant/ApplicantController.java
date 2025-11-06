package com.tss.loan.controller.applicant;

import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
import com.tss.loan.dto.response.PersonalDetailsCreateResponse;
import com.tss.loan.dto.response.ProfileStatusResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.service.PersonalDetailsService;
import com.tss.loan.service.ProfileCompletionService;
import com.tss.loan.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/applicant")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('APPLICANT')")
public class ApplicantController {

    private final PersonalDetailsService personalDetailsService;
    private final ProfileCompletionService profileCompletionService;
    private final UserService userService;

    /**
     * Get profile completion status for current applicant
     */
    @GetMapping("/profile/status")
    public ResponseEntity<ProfileStatusResponse> getProfileStatus(Authentication authentication) {
        log.info("Checking profile status for applicant: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        ProfileStatusResponse response = profileCompletionService.getProfileStatus(user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get personal details for current applicant
     */
    @GetMapping("/profile/personal-details")
    public ResponseEntity<PersonalDetailsCreateResponse> getPersonalDetails(Authentication authentication) {
        
        log.info("Getting personal details for applicant: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        PersonalDetailsCreateResponse response = personalDetailsService.getPersonalDetailsForUser(user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Create/Update personal details for current applicant
     */
    @PostMapping("/profile/personal-details")
    public ResponseEntity<PersonalDetailsCreateResponse> createOrUpdatePersonalDetails(
            @Valid @RequestBody ApplicantPersonalDetailsRequest request,
            Authentication authentication) {
        
        log.info("Creating/updating personal details for applicant: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        PersonalDetailsCreateResponse response = personalDetailsService.createOrUpdatePersonalDetailsWithResponse(request, user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update personal details for current applicant (PUT method for updates)
     */
    @PutMapping("/profile/personal-details")
    public ResponseEntity<PersonalDetailsCreateResponse> updatePersonalDetails(
            @Valid @RequestBody ApplicantPersonalDetailsRequest request,
            Authentication authentication) {
        
        log.info("Updating personal details for applicant: {}", authentication.getName());
        
        User user = getCurrentUser(authentication);
        PersonalDetailsCreateResponse response = personalDetailsService.createOrUpdatePersonalDetailsWithResponse(request, user);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Upload profile photo for applicant
     */
    @PostMapping("/profile/profile-photo")
    public ResponseEntity<Map<String, String>> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        
        log.info("Uploading profile photo for applicant: {}", authentication.getName());
        
        // For now, just return success
        // TODO: Implement actual file storage logic
        return ResponseEntity.ok(Map.of(
            "message", "Profile photo upload feature coming soon",
            "status", "success"
        ));
    }
    
    private User getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userService.findByEmail(userDetails.getUsername());
    }
}
