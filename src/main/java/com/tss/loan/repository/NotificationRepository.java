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

import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.system.Notification;
import com.tss.loan.entity.user.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find user notifications
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // Find unread notifications
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUser(@Param("user") User user);
    
    // Count unread notifications
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false")
    long countUnreadByUser(@Param("user") User user);
    
    // Find pending notifications (not sent)
    @Query("SELECT n FROM Notification n WHERE n.isSent = false ORDER BY n.createdAt ASC")
    List<Notification> findPendingNotifications();
    
    // Find notifications by type
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findByUserAndType(@Param("user") User user, @Param("type") NotificationType type);
    
    // Find notifications related to entity
    @Query("SELECT n FROM Notification n WHERE n.relatedEntityType = :entityType AND n.relatedEntityId = :entityId ORDER BY n.createdAt DESC")
    List<Notification> findByRelatedEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);
    
    // Mark all as read for user
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user = :user AND n.isRead = false")
    int markAllAsReadForUser(@Param("user") User user, @Param("readAt") LocalDateTime readAt);
    
    // Delete old read notifications (cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.readAt < :cutoffDate")
    int deleteOldReadNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Find failed notifications for retry
    @Query("SELECT n FROM Notification n WHERE n.isSent = false AND n.createdAt < :retryTime ORDER BY n.createdAt ASC")
    List<Notification> findFailedNotificationsForRetry(@Param("retryTime") LocalDateTime retryTime);
}
