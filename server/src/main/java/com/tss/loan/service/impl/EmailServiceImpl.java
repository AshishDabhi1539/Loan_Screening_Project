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
            String subject = "🔐 Email Verification - Loanify";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #2c3e50; text-align: center;'>🔐 Email Verification</h2>" +
                "<p>Hi there,</p>" +
                "<p>Thank you for registering with Loanify! Please verify your email address using the code below:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<span style='font-size: 32px; font-weight: bold; color: #3498db; background: #f8f9fa; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; border: 2px dashed #3498db;'>%s</span>" +
                "</div>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>⏰ This code will expire in 10 minutes.</strong></p>" +
                "</div>" +
                "<div style='background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>🚫 Security Alert:</strong> Do not share this code with anyone. Our team will never ask for this code.</p>" +
                "</div>" +
                "<p>If you didn't create an account, please ignore this email.</p>" +
                "<p style='margin-top: 30px;'>Best regards,<br><strong>Loanify Team</strong></p>" +
                "<hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loanify - Your Loan Solution. All rights reserved.</p>" +
                "<p style='color: #7f8c8d; font-size: 11px; text-align: center;'>This is an automated email. Please do not reply.</p>" +
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
            String subject = "🎉 Welcome to Loanify!";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #27ae60; text-align: center;'>🎉 Welcome to Loanify!</h2>" +
                "<div style='text-align: center; margin: 20px 0;'>" +
                "<div style='display: inline-block; background: #d4edda; border-radius: 50%%; padding: 20px;'>" +
                "<svg style='width: 60px; height: 60px;' fill='#27ae60' viewBox='0 0 20 20'>" +
                "<path fill-rule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clip-rule='evenodd'/>" +
                "</svg>" +
                "</div>" +
                "</div>" +
                "<p>Hi <strong>%s</strong>! 👋</p>" +
                "<p>Your account has been successfully created and verified. Welcome to Loanify - Your Loan Solution!</p>" +
                "<div style='background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;'>" +
                "<h3 style='color: #2c3e50; margin-top: 0;'>✅ You can now:</h3>" +
                "<ul style='color: #34495e; margin: 10px 0;'>" +
                "<li>Apply for various types of loans</li>" +
                "<li>Track your application status in real-time</li>" +
                "<li>Upload and manage documents securely</li>" +
                "<li>Receive instant notifications and updates</li>" +
                "</ul>" +
                "</div>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Login to Your Account</a>" +
                "</p>" +
                "<p>Need help? Contact our support team at <a href='mailto:support@loanify.com' style='color: #3498db;'>support@loanify.com</a></p>" +
                "<p style='margin-top: 30px;'>Thank you for choosing us! 🙏<br><strong>Loanify Team</strong></p>" +
                "<hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loanify - Your Loan Solution. All rights reserved.</p>" +
                "<p style='color: #7f8c8d; font-size: 11px; text-align: center;'>This is an automated email. Please do not reply.</p>" +
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
            String subject = "📋 Loan Application Update - Loanify";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #2c3e50; text-align: center;'>📋 Loan Application Update</h2>" +
                "<p>Hi there,</p>" +
                "<p>Your loan application status has been updated. Here are the details:</p>" +
                "<div style='background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 5px 0;'><strong>Application ID:</strong> %s</p>" +
                "<p style='margin: 5px 0;'><strong>Current Status:</strong> <span style='color: #e74c3c; font-weight: bold; font-size: 16px;'>%s</span></p>" +
                "</div>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>📌 Next Steps:</strong> Login to your account to view complete details and take any required actions.</p>" +
                "</div>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>View Application Details</a>" +
                "</p>" +
                "<p style='margin-top: 30px;'>Thank you for choosing Loanify! 🙏<br><strong>Loanify Team</strong></p>" +
                "<hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loanify - Your Loan Solution. All rights reserved.</p>" +
                "<p style='color: #7f8c8d; font-size: 11px; text-align: center;'>This is an automated email. Please do not reply.</p>" +
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
            String subject = "🔐 Officer Account Created - Loanify";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #2c3e50; text-align: center;'>🔐 Officer Account Created</h2>" +
                "<p>Dear Officer,</p>" +
                "<p>Your officer account has been successfully created in the Loanify system. Below are your login credentials:</p>" +
                "<div style='background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 5px 0;'><strong>Email:</strong> %s</p>" +
                "<p style='margin: 5px 0;'><strong>Role:</strong> <span style='color: #2c3e50; font-weight: bold;'>%s</span></p>" +
                "<p style='margin: 5px 0;'><strong>Temporary Password:</strong> <span style='font-size: 18px; color: #e74c3c; font-weight: bold; background: #f8f9fa; padding: 5px 10px; border-radius: 4px; letter-spacing: 2px;'>%s</span></p>" +
                "</div>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>⚠️ Important Security Notice:</strong></p>" +
                "<ul style='margin: 10px 0;'>" +
                "<li>Please change your password immediately after first login</li>" +
                "<li>Do not share your credentials with anyone</li>" +
                "<li>Use a strong, unique password</li>" +
                "</ul>" +
                "</div>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Login to Dashboard</a>" +
                "</p>" +
                "<p style='margin-top: 30px;'>Best regards,<br><strong>Loanify Admin Team</strong></p>" +
                "<hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loanify - Your Loan Solution. All rights reserved.</p>" +
                "<p style='color: #7f8c8d; font-size: 11px; text-align: center;'>This is an automated email. Please do not reply.</p>" +
                "</div></body></html>",
                toEmail, role, tempPassword
            );
            
            return sendEmail(toEmail, subject, content, createdBy, "OFFICER_CREDENTIALS_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send officer credentials to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendGenericHtml(String toEmail, String subject, String htmlContent, User user, String eventType) {
        try {
            return sendEmail(toEmail, subject, htmlContent, user, "GENERIC_EMAIL_SENT_" + eventType);
        } catch (Exception e) {
            logger.error("Failed to send generic HTML email to {}: {}", toEmail, e.getMessage());
            auditLogService.logAction(user, "GENERIC_EMAIL_FAILED_" + eventType, "Notification", null, 
                "Failed to send generic email: " + e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendPasswordResetOtpEmail(String toEmail, String otpCode, User user) {
        try {
            String subject = "🔐 Password Reset Request - Loanify";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #e74c3c; text-align: center;'>🔐 Password Reset Request</h2>" +
                "<p>Hi there,</p>" +
                "<p>We received a request to reset your password. Use the code below to reset your password:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<span style='font-size: 32px; font-weight: bold; color: #e74c3c; background: #f8f9fa; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; border: 2px dashed #e74c3c;'>%s</span>" +
                "</div>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>⏰ This code will expire in 15 minutes.</strong></p>" +
                "</div>" +
                "<div style='background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>🚫 Security Alert:</strong> Do not share this code with anyone. Our team will never ask for this code.</p>" +
                "</div>" +
                "<p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>" +
                "<p style='margin-top: 30px;'>Best regards,<br><strong>Loanify Team</strong></p>" +
                "<hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loanify - Your Loan Solution. All rights reserved.</p>" +
                "<p style='color: #7f8c8d; font-size: 11px; text-align: center;'>This is an automated email. Please do not reply.</p>" +
                "</div></body></html>",
                otpCode
            );
            
            return sendEmail(toEmail, subject, content, user, "PASSWORD_RESET_OTP_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send password reset OTP email to {}: {}", toEmail, e.getMessage());
            auditLogService.logAction(user, "PASSWORD_RESET_OTP_FAILED", "Notification", null, 
                "Failed to send password reset OTP email: " + e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendPasswordResetSuccessEmail(String toEmail, User user) {
        try {
            String subject = "✅ Password Successfully Reset - Loanify";
            String content = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #27ae60; text-align: center;'>✅ Password Successfully Reset</h2>" +
                "<div style='text-align: center; margin: 20px 0;'>" +
                "<div style='display: inline-block; background: #d4edda; border-radius: 50%%; padding: 20px;'>" +
                "<svg style='width: 60px; height: 60px;' fill='#27ae60' viewBox='0 0 20 20'>" +
                "<path fill-rule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clip-rule='evenodd'/>" +
                "</svg>" +
                "</div>" +
                "</div>" +
                "<p>Hi <strong>%s</strong>,</p>" +
                "<p>Your password has been successfully reset. You can now log in to your account with your new password.</p>" +
                "<div style='background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>🔒 Security Tip:</strong> Make sure to use a strong, unique password and never share it with anyone.</p>" +
                "</div>" +
                "<div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0;'><strong>⚠️ Didn't make this change?</strong></p>" +
                "<p style='margin: 10px 0 0 0;'>If you didn't reset your password, please contact our support team immediately at <a href='mailto:support@loanify.com'>support@loanify.com</a></p>" +
                "</div>" +
                "<p style='text-align: center; margin: 30px 0;'>" +
                "<a href='#' style='background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Login to Your Account</a>" +
                "</p>" +
                "<p style='margin-top: 30px;'>Best regards,<br><strong>Loanify Team</strong></p>" +
                "<hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>" +
                "<p style='color: #7f8c8d; font-size: 12px; text-align: center;'>© 2024 Loanify - Your Loan Solution. All rights reserved.</p>" +
                "<p style='color: #7f8c8d; font-size: 11px; text-align: center;'>This is an automated email. Please do not reply.</p>" +
                "</div></body></html>",
                user.getEmail()
            );
            
            return sendEmail(toEmail, subject, content, user, "PASSWORD_RESET_SUCCESS_EMAIL_SENT");
            
        } catch (Exception e) {
            logger.error("Failed to send password reset success email to {}: {}", toEmail, e.getMessage());
            auditLogService.logAction(user, "PASSWORD_RESET_SUCCESS_EMAIL_FAILED", "Notification", null, 
                "Failed to send password reset success email: " + e.getMessage());
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
