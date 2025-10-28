package com.tss.loan.service;

import com.tss.loan.entity.user.User;

public interface EmailService {
    boolean sendOtpEmail(String toEmail, String otpCode, User user);
    boolean sendWelcomeEmail(String toEmail, String userName, User user);
    boolean sendLoanStatusEmail(String toEmail, String status, String applicationId, User user);
    boolean sendOfficerCredentials(String toEmail, String tempPassword, String role, User createdBy);
}
