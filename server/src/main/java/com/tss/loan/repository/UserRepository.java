package com.tss.loan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.user.User;
import com.tss.loan.entity.enums.UserStatus;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // Authentication queries
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmailOrPhone(String email, String phone);
    
    // Status-based queries
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = :status")
    Optional<User> findByEmailAndStatus(@Param("email") String email, @Param("status") UserStatus status);
    
    @Query("SELECT u FROM User u WHERE u.phone = :phone AND u.status = :status")
    Optional<User> findByPhoneAndStatus(@Param("phone") String phone, @Param("status") UserStatus status);
    
    // Verification status queries
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isEmailVerified = true")
    Optional<User> findByEmailAndEmailVerified(@Param("email") String email);
    
    @Query("SELECT u FROM User u WHERE u.phone = :phone AND u.isPhoneVerified = true")
    Optional<User> findByPhoneAndPhoneVerified(@Param("phone") String phone);
    
    // Existence checks
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    
    // Security queries
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.failedLoginAttempts < 5")
    Optional<User> findActiveUserByEmail(@Param("email") String email);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.status = :status")
    long countByStatus(@Param("status") UserStatus status);
    
    // Admin-specific queries
    @Query("SELECT u FROM User u WHERE u.role = :role")
    List<User> findByRole(@Param("role") com.tss.loan.entity.enums.RoleType role);
    
    @Query("SELECT u FROM User u WHERE u.role IN ('LOAN_OFFICER', 'COMPLIANCE_OFFICER') ORDER BY u.createdAt DESC")
    List<User> findAllOfficers();
    
    @Query("SELECT u FROM User u WHERE u.role = 'ADMIN'")
    Optional<User> findAdmin();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") com.tss.loan.entity.enums.RoleType role);
    
    // Officer assignment queries
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.status = :status")
    List<User> findByRoleAndStatus(@Param("role") com.tss.loan.entity.enums.RoleType role, @Param("status") UserStatus status);
}
