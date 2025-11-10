package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for audit log entries (combines AuditLog and ApplicationWorkflow)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    
    private Long id;
    private String action;
    private String performedBy;
    private String performedByEmail;
    private LocalDateTime timestamp;
    private String entityType;
    private String entityId;
    private String details;
    private String ipAddress;
    private String userAgent;
    private String status;
    private String changeType; // "AUDIT_LOG" or "WORKFLOW_CHANGE"
    
    // For workflow changes
    private String fromStatus;
    private String toStatus;
    private String comments;
    private String systemRemarks;
    private Boolean isSystemGenerated;
    
    // For audit logs
    private String oldValues;
    private String newValues;
    private String additionalInfo;
}
