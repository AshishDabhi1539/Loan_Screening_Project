package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.loan.entity.system.Notification;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.NotificationRepository;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.NotificationService;

@Service
public class NotificationServiceImpl implements NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Override
    public Notification createNotification(User user, String type, String title, String message) {
        return createNotification(user, type, title, message, null, null);
    }
    
    @Override
    public Notification createNotification(User user, String type, String title, String message, 
                                         String relatedEntityType, Long relatedEntityId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setIsRead(false);
        notification.setIsSent(true); // Assuming in-app notifications are always "sent"
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        
        auditLogService.logAction(user, "NOTIFICATION_CREATED", "Notification", saved.getId(), 
            "Notification created: " + title);
        
        return saved;
    }
    
    @Override
    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findUnreadByUser(user);
    }
    
    @Override
    public long getUnreadCount(User user) {
        return notificationRepository.countUnreadByUser(user);
    }
    
    @Override
    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new LoanApiException("Notification not found"));
        
        // Verify the notification belongs to the user
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new LoanApiException("Access denied to this notification");
        }
        
        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            auditLogService.logAction(user, "NOTIFICATION_READ", "Notification", notificationId, 
                "Notification marked as read");
        }
    }
    
    @Override
    public void markAllAsRead(User user) {
        int updatedCount = notificationRepository.markAllAsReadForUser(user, LocalDateTime.now());
        
        auditLogService.logAction(user, "NOTIFICATIONS_READ_ALL", "Notification", null, 
            "Marked " + updatedCount + " notifications as read");
    }
    
    @Override
    public void processFailedNotifications() {
        // This would be used for email notifications that failed to send
        // For now, just log the action
        LocalDateTime retryTime = LocalDateTime.now().minusMinutes(5);
        notificationRepository.findFailedNotificationsForRetry(retryTime);
        
        // In a real implementation, you would retry sending these notifications
        // Could add logging if needed
    }
}
