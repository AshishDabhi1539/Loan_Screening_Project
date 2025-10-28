package com.tss.loan.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.tss.loan.entity.user.User;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.EmailService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);
    
    @Autowired
    private JavaMailSender javaMailSender;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Override
    public boolean sendOtpEmail(String toEmail, String otpCode, User user) {
        try {
            String subject = "🔐 Loan Screening App - Email Verification";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #2c3e50; text-align: center;'>🔐 Email Verification</h2>" +
                "<p>Dear User,</p>" +
                "<p>Your verification code is:</p>" +
                "<div style='text-align: center; margin: 20px 0;'>" +
                "<span style='font-size: 24px; font-weight: bold; color: #e74c3c; background: #f8f9fa; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;'>%s</span>" +
                "</div>" +
                "<p><strong>⏰ This code will expire in 10 minutes.</strong></p>" +
                "<p><strong>🚫 Do not share this code with anyone.</strong></p>" +
                "<p>If you didn't request this code, please ignore this email.</p>" +
                "<hr style='margin: 20px 0;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loan Screening App. All rights reserved.</p>" +
                "</div></body></html>",
                otpCode
            );
            
            return sendEmail(toEmail, subject, content, user, "EMAIL_OTP_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            auditLogService.logAction(user, "EMAIL_OTP_FAILED", "OtpVerification", null, 
                "Failed to send OTP email: " + e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendWelcomeEmail(String toEmail, String userName, User user) {
        try {
            String subject = "🎉 Welcome to Loan Screening App!";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #27ae60; text-align: center;'>🎉 Welcome to Loan Screening App!</h2>" +
                "<p>Hi <strong>%s</strong>! 👋</p>" +
                "<p>Your account has been successfully created and verified.</p>" +
                "<div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>" +
                "<h3 style='color: #2c3e50; margin-top: 0;'>✅ You can now:</h3>" +
                "<ul style='color: #34495e;'>" +
                "<li>Apply for loans</li>" +
                "<li>Track application status</li>" +
                "<li>Upload documents</li>" +
                "<li>Receive real-time updates</li>" +
                "</ul>" +
                "</div>" +
                "<p>Need help? Contact our support team at <a href='mailto:support@loanscreening.com'>support@loanscreening.com</a></p>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;'>Login to Your Account</a>" +
                "</p>" +
                "<p>Thank you for choosing us! 🙏</p>" +
                "<hr style='margin: 20px 0;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loan Screening App. All rights reserved.</p>" +
                "</div></body></html>",
                userName
            );
            
            return sendEmail(toEmail, subject, content, user, "WELCOME_EMAIL_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendLoanStatusEmail(String toEmail, String status, String applicationId, User user) {
        try {
            String subject = "📋 Loan Application Update - " + applicationId;
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #2c3e50; text-align: center;'>📋 Loan Application Update</h2>" +
                "<div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>" +
                "<p><strong>Application ID:</strong> %s</p>" +
                "<p><strong>Status:</strong> <span style='color: #e74c3c; font-weight: bold;'>%s</span></p>" +
                "</div>" +
                "<p>Login to your account for more details and next steps.</p>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;'>View Application</a>" +
                "</p>" +
                "<p>Thank you! 🙏</p>" +
                "<hr style='margin: 20px 0;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loan Screening App. All rights reserved.</p>" +
                "</div></body></html>",
                applicationId, status
            );
            
            return sendEmail(toEmail, subject, content, user, "STATUS_EMAIL_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send status email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendOfficerCredentials(String toEmail, String tempPassword, String role, User createdBy) {
        try {
            String subject = "🔐 Loan Screening App - Officer Account Created";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #2c3e50; text-align: center;'>🔐 Officer Account Created</h2>" +
                "<p>Dear Officer,</p>" +
                "<p>Your account has been created with the following credentials:</p>" +
                "<div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>" +
                "<p><strong>Email:</strong> %s</p>" +
                "<p><strong>Role:</strong> %s</p>" +
                "<p><strong>Temporary Password:</strong> <span style='color: #e74c3c; font-weight: bold;'>%s</span></p>" +
                "</div>" +
                "<p><strong>⚠️ Please change your password after first login.</strong></p>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;'>Login Now</a>" +
                "</p>" +
                "<hr style='margin: 20px 0;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loan Screening App. All rights reserved.</p>" +
                "</div></body></html>",
                toEmail, role, tempPassword
            );
            
            return sendEmail(toEmail, subject, content, createdBy, "OFFICER_CREDENTIALS_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send officer credentials to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
    
    private boolean sendEmail(String toEmail, String subject, String content, User user, String auditAction) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            
            helper.setSubject(subject);
            helper.setFrom(new InternetAddress(fromEmail));
            helper.setTo(toEmail);
            helper.setText(content, true); // true for HTML content
            
            javaMailSender.send(mimeMessage);
            
            logger.info("Email sent successfully to {}", toEmail);
            auditLogService.logAction(user, auditAction, "Notification", null, 
                "Email sent to: " + toEmail);
            
            return true;
            
        } catch (MessagingException e) {
            logger.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            auditLogService.logAction(user, auditAction + "_FAILED", "Notification", null, 
                "Failed to send email: " + e.getMessage());
            return false;
        }
    }
}
