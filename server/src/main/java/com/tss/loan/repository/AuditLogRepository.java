package com.tss.loan.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.entity.system.AuditLog;
import com.tss.loan.entity.user.User;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    // Find audit logs by user
    Page<AuditLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);
    
    // Find audit logs by action
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
    
    // Find audit logs by entity
    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.timestamp DESC")
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(
        @Param("entityType") String entityType, 
        @Param("entityId") Long entityId
    );
    
    // Find recent activities
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp >= :fromDate ORDER BY a.timestamp DESC")
    Page<AuditLog> findRecentActivities(@Param("fromDate") LocalDateTime fromDate, Pageable pageable);
    
    // Find user activities in date range
    @Query("SELECT a FROM AuditLog a WHERE a.user = :user AND a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    List<AuditLog> findUserActivitiesInDateRange(
        @Param("user") User user, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    // Security monitoring - failed login attempts
    @Query("SELECT a FROM AuditLog a WHERE a.action = 'LOGIN_FAILED' AND a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<AuditLog> findFailedLoginAttemptsSince(@Param("since") LocalDateTime since);
    
    // Count actions by user in time period
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.user = :user AND a.action = :action AND a.timestamp >= :since")
    long countUserActionsSince(
        @Param("user") User user, 
        @Param("action") String action, 
        @Param("since") LocalDateTime since
    );
    
    // Archive old logs (for cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM AuditLog a WHERE a.timestamp < :cutoffDate")
    int deleteOldLogs(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Find audit logs by action and entity type
    @Query("SELECT a FROM AuditLog a WHERE a.action = :action AND a.entityType = :entityType ORDER BY a.timestamp DESC")
    List<AuditLog> findByActionAndEntityTypeOrderByTimestampDesc(
        @Param("action") String action,
        @Param("entityType") String entityType
    );
}
