package com.tss.loan.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.tss.loan.entity.system.Notification;
import com.tss.loan.repository.NotificationRepository;

@Component
public class NotificationSchedulers {
    private static final Logger log = LoggerFactory.getLogger(NotificationSchedulers.class);

    @Autowired
    private NotificationRepository notificationRepository;

    // Retry failed (not sent) emails every 10 minutes
    @Scheduled(cron = "0 */10 * * * *")
    public void retryFailedEmails() {
        List<Notification> failed = notificationRepository.findFailedNotificationsForRetry(LocalDateTime.now().minusMinutes(10));
        if (!failed.isEmpty()) {
            log.info("Found {} notifications to retry (email path placeholder).", failed.size());
            // Integrate with EmailService if you persist email-notification coupling.
        }
    }

    // Cleanup read notifications older than 30 days, nightly at 02:30
    @Scheduled(cron = "0 30 2 * * *")
    public void cleanupOldRead() {
        int deleted = notificationRepository.deleteOldReadNotifications(LocalDateTime.now().minusDays(30));
        if (deleted > 0) {
            log.info("Deleted {} old read notifications.", deleted);
        }
    }
}


