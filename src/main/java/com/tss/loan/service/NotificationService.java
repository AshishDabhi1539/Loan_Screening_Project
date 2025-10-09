package com.tss.loan.service;

import java.util.List;

import com.tss.loan.entity.system.Notification;
import com.tss.loan.entity.user.User;

public interface NotificationService {
    Notification createNotification(User user, String type, String title, String message);
    Notification createNotification(User user, String type, String title, String message, 
                                  String relatedEntityType, Long relatedEntityId);
    List<Notification> getUnreadNotifications(User user);
    long getUnreadCount(User user);
    void markAsRead(Long notificationId, User user);
    void markAllAsRead(User user);
    void processFailedNotifications();
}
