package com.tss.loan.events;

import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEvent;

import com.tss.loan.entity.enums.BusinessEventType;

public class NotificationDomainEvent extends ApplicationEvent {
    private final BusinessEventType eventType;
    private final UUID recipientUserId;
    private final Map<String, Object> variables;

    public NotificationDomainEvent(Object source, BusinessEventType eventType, UUID recipientUserId, Map<String, Object> variables) {
        super(source);
        this.eventType = eventType;
        this.recipientUserId = recipientUserId;
        this.variables = variables;
    }

    public BusinessEventType getEventType() { return eventType; }
    public UUID getRecipientUserId() { return recipientUserId; }
    public Map<String, Object> getVariables() { return variables; }
}


