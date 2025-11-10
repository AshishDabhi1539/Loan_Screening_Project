package com.tss.loan.dto.response;

import java.time.LocalDateTime;

import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.enums.NotificationPriority;
import com.tss.loan.entity.enums.RecipientRole;
import com.tss.loan.entity.system.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private NotificationPriority priority;
    private RecipientRole recipientRole;
    private String title;
    private String message;
    private Boolean isRead;
    private Boolean isSent;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String metadataJson;
    private String createdByEvent;

    public static NotificationResponse fromEntity(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .priority(n.getPriority())
                .recipientRole(n.getRecipientRole())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .isSent(n.getIsSent())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .relatedEntityType(n.getRelatedEntityType())
                .relatedEntityId(n.getRelatedEntityId())
                .metadataJson(n.getMetadataJson())
                .createdByEvent(n.getCreatedByEvent())
                .build();
    }
}


