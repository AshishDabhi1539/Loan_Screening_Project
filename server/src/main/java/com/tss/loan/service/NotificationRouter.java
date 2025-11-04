package com.tss.loan.service;

import java.util.List;

import com.tss.loan.entity.enums.BusinessEventType;
import com.tss.loan.entity.enums.NotificationPriority;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.enums.RecipientRole;

public interface NotificationRouter {
    List<Route> resolve(BusinessEventType eventType);

    class Route {
        public final RecipientRole role;
        public final List<NotificationType> channels;
        public final NotificationPriority priority;
        public final String templateCode;

        public Route(RecipientRole role, List<NotificationType> channels, NotificationPriority priority, String templateCode) {
            this.role = role;
            this.channels = channels;
            this.priority = priority;
            this.templateCode = templateCode;
        }
    }
}


