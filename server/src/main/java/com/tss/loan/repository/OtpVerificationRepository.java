package com.tss.loan.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.entity.security.OtpVerification;
import com.tss.loan.entity.user.User;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    
    // Find active OTP for verification
    @Query("SELECT o FROM OtpVerification o WHERE o.user = :user AND o.otpType = :otpType " +
           "AND o.isVerified = false AND o.isExpired = false AND o.expiresAt > :currentTime " +
           "ORDER BY o.createdAt DESC")
    Optional<OtpVerification> findActiveOtpByUserAndType(
        @Param("user") User user, 
        @Param("otpType") String otpType, 
        @Param("currentTime") LocalDateTime currentTime
    );
    
    // Find OTP by code and user
    @Query("SELECT o FROM OtpVerification o WHERE o.user = :user AND o.otpCode = :otpCode " +
           "AND o.isVerified = false AND o.isExpired = false AND o.expiresAt > :currentTime")
    Optional<OtpVerification> findValidOtpByUserAndCode(
        @Param("user") User user, 
        @Param("otpCode") String otpCode, 
        @Param("currentTime") LocalDateTime currentTime
    );
    
    // Find all OTPs for a user and type
    List<OtpVerification> findByUserAndOtpTypeOrderByCreatedAtDesc(User user, String otpType);
    
    // Expire old OTPs
    @Modifying
    @Transactional
    @Query("UPDATE OtpVerification o SET o.isExpired = true WHERE o.expiresAt < :currentTime AND o.isExpired = false")
    int expireOldOtps(@Param("currentTime") LocalDateTime currentTime);
    
    // Count attempts in last hour
    @Query("SELECT COUNT(o) FROM OtpVerification o WHERE o.user = :user AND o.otpType = :otpType " +
           "AND o.createdAt > :oneHourAgo")
    long countRecentAttempts(
        @Param("user") User user, 
        @Param("otpType") String otpType, 
        @Param("oneHourAgo") LocalDateTime oneHourAgo
    );
    
    // Delete old verified OTPs (cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.isVerified = true AND o.createdAt < :cutoffDate")
    int deleteOldVerifiedOtps(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Invalidate all previous OTPs for user and type (SECURITY FIX)
    @Modifying
    @Transactional
    @Query("UPDATE OtpVerification o SET o.isExpired = true WHERE o.user = :user AND o.otpType = :otpType " +
           "AND o.isVerified = false AND o.isExpired = false")
    int invalidatePreviousOtps(@Param("user") User user, @Param("otpType") String otpType);
}
