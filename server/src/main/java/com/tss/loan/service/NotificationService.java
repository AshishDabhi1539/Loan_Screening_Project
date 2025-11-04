package com.tss.loan.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.system.Notification;
import com.tss.loan.entity.user.User;

public interface NotificationService {
    Notification createNotification(User user, NotificationType type, String title, String message);
    Notification createNotification(User user, NotificationType type, String title, String message, 
                                  String relatedEntityType, Long relatedEntityId);
    List<Notification> getUnreadNotifications(User user);
    long getUnreadCount(User user);
    void markAsRead(Long notificationId, User user);
    void markAllAsRead(User user);
    int markSelectedAsRead(User user, List<Long> ids);
    Page<Notification> list(User user, Boolean isRead, NotificationType type, Pageable pageable);
    void processFailedNotifications();
}
