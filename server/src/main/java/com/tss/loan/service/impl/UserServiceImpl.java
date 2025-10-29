package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.loan.dto.request.OfficerCreationRequest;
import com.tss.loan.dto.request.OfficerPersonalDetailsRequest;
import com.tss.loan.dto.request.UserRegistrationRequest;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.enums.UserStatus;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.UserRepository;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.EmailService;
import com.tss.loan.service.NotificationService;
import com.tss.loan.service.OfficerProfileService;
import com.tss.loan.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private OfficerProfileService officerProfileService;

    @Override
    public User createUser(UserRegistrationRequest request) {
        // Only database validations - format validation is in DTO
        validateUserDoesNotExist(request.getEmail(), request.getPhone());

        // Password match validation (business logic)
        if (!request.isPasswordMatching()) {
            throw new LoanApiException("Passwords do not match");
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(RoleType.APPLICANT); // Default role
        user.setStatus(UserStatus.PENDING_VERIFICATION); // User must verify email first
        user.setIsEmailVerified(false);
        user.setIsPhoneVerified(true); // Auto-verified (no WhatsApp)
        user.setFailedLoginAttempts(0);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Create welcome notification
        notificationService.createNotification(
            savedUser,
            NotificationType.IN_APP,
            "Welcome to Loan Screening System",
            "Welcome! Your account has been created successfully. Please verify your email to activate your account."
        );

        auditLogService.logAction(savedUser, "USER_REGISTERED", "User", null,
                "New user registered with email: " + request.getEmail());
        return savedUser;
    }

    @Override
    public User createOfficer(OfficerCreationRequest request, User createdBy) {
        // Database and business validations only
        validateAdminRole(createdBy);
        validateOfficerRole(request.getRole());
        validateUserDoesNotExist(request.getEmail(), request.getPhone());

        // Create new officer
        User officer = new User();
        officer.setEmail(request.getEmail());
        officer.setPhone(request.getPhone());
        officer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        officer.setRole(request.getRole());
        officer.setStatus(UserStatus.ACTIVE);
        officer.setIsEmailVerified(true); // Officers are pre-verified
        officer.setIsPhoneVerified(true);
        officer.setFailedLoginAttempts(0);
        officer.setCreatedAt(LocalDateTime.now());
        officer.setUpdatedAt(LocalDateTime.now());

        User savedOfficer = userRepository.save(officer);

        // ✅ IMMEDIATELY CREATE OFFICER PROFILE with personal details
        try {
            OfficerPersonalDetailsRequest profileRequest = new OfficerPersonalDetailsRequest();
            profileRequest.setFirstName(request.getFirstName());
            profileRequest.setLastName(request.getLastName());
            profileRequest.setMiddleName(request.getMiddleName());
            profileRequest.setDepartment(request.getDepartment());
            profileRequest.setDesignation(request.getDesignation());
            profileRequest.setPhoneNumber(request.getPhoneNumber());
            profileRequest.setWorkLocation(request.getWorkLocation());
            
            officerProfileService.createOrUpdateOfficerDetails(profileRequest, savedOfficer);
            
            auditLogService.logAction(createdBy, "OFFICER_PROFILE_AUTO_CREATED", "OfficerPersonalDetails", null,
                "Auto-created officer profile for: " + savedOfficer.getEmail());
                
        } catch (Exception e) {
            // Log error but don't fail officer creation
            auditLogService.logAction(createdBy, "OFFICER_PROFILE_CREATION_FAILED", "OfficerPersonalDetails", null,
                "Failed to auto-create officer profile for: " + savedOfficer.getEmail() + ". Error: " + e.getMessage());
        }

        // Send credentials email
        emailService.sendOfficerCredentials(request.getEmail(), request.getPassword(),
                request.getRole().toString(), createdBy);

        auditLogService.logAction(createdBy, "OFFICER_CREATED", "User", null,
                "Created " + request.getRole() + " with email: " + request.getEmail());

        return savedOfficer;
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new LoanApiException("User not found with email: " + email));
    }

    @Override
    public User findByEmailOrPhone(String emailOrPhone) {
        // Try to find by email first
        Optional<User> userOpt = userRepository.findByEmail(emailOrPhone);
        if (userOpt.isPresent()) {
            return userOpt.get();
        }

        // Try to find by phone
        userOpt = userRepository.findByPhone(emailOrPhone);
        if (userOpt.isPresent()) {
            return userOpt.get();
        }

        throw new LoanApiException("User not found with email or phone: " + emailOrPhone);
    }

    @Override
    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new LoanApiException("User not found with ID: " + id));
    }

    @Override
    public List<User> findAllOfficers() {
        return userRepository.findAllOfficers();
    }

    @Override
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User updateEmailVerificationStatus(User user, boolean verified) {
        user.setIsEmailVerified(verified);
        
        // SECURITY FIX: Activate user only after email verification
        if (verified && user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
            auditLogService.logAction(user, "ACCOUNT_ACTIVATED", "User", null,
                "Account activated after email verification");
        }
        
        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);

        auditLogService.logAction(user, "EMAIL_VERIFICATION_UPDATED", "User", null,
                "Email verification status updated to: " + verified);

        return updatedUser;
    }

    @Override
    public User updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        auditLogService.logAction(user, "USER_UPDATED", "User", null,
                "User information updated");

        return updatedUser;
    }
    
    @Override
    public User saveUserDirectly(User user) {
        // Save user directly without validation (used after OTP verification)
        User savedUser = userRepository.save(user);
        
        // Create welcome notification
        notificationService.createNotification(
            savedUser,
            NotificationType.IN_APP,
            "Welcome to Loan Screening System",
            "Welcome! Your account has been created and verified successfully."
        );
        
        auditLogService.logAction(savedUser, "USER_CREATED_AFTER_VERIFICATION", "User", null,
                "User created after successful email verification: " + savedUser.getEmail());
        
        return savedUser;
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }

    // ===== DATABASE VALIDATION METHODS ONLY =====

    /**
     * Validate that user doesn't already exist
     */
    private void validateUserDoesNotExist(String email, String phone) {
        // Check email uniqueness
        if (existsByEmail(email)) {
            throw new LoanApiException(
                    "An account with this email address already exists. Please use a different email or try logging in.");
        }

        // Check phone uniqueness
        if (existsByPhone(phone)) {
            throw new LoanApiException(
                    "An account with this phone number already exists. Please use a different phone number or try logging in.");
        }
    }

    /**
     * Validate admin role for officer creation
     */
    private void validateAdminRole(User createdBy) {
        if (createdBy.getRole() != RoleType.ADMIN) {
            throw new LoanApiException("Only administrators can create officer accounts");
        }
    }

    /**
     * Validate officer role
     */
    private void validateOfficerRole(RoleType role) {
        if (role == RoleType.ADMIN) {
            throw new LoanApiException("Cannot create additional admin accounts");
        }

        if (role == RoleType.APPLICANT) {
            throw new LoanApiException("Cannot create applicant accounts through officer creation");
        }

        if (role != RoleType.LOAN_OFFICER && role != RoleType.COMPLIANCE_OFFICER) {
            throw new LoanApiException("Invalid role. Only LOAN_OFFICER and COMPLIANCE_OFFICER are allowed.");
        }
    }

}
