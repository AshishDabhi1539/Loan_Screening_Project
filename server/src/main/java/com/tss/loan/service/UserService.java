package com.tss.loan.service;

import java.util.List;
import java.util.UUID;

import com.tss.loan.dto.request.OfficerCreationRequest;
import com.tss.loan.dto.request.UserRegistrationRequest;
import com.tss.loan.entity.user.User;

public interface UserService {
    User createUser(UserRegistrationRequest request);
    User createOfficer(OfficerCreationRequest request, User createdBy);
    User findByEmail(String email);
    User findByEmailOrPhone(String emailOrPhone);
    User findById(UUID id);
    List<User> findAllOfficers();
    List<User> findAllUsers();
    User updateEmailVerificationStatus(User user, boolean verified);
    User updateUser(User user);
    User saveUserDirectly(User user); // Save user without validation (for post-verification creation)
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
