package com.tss.loan.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.tss.loan.entity.system.AuditLog;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.AuditLogRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void logAction(User user, String action, String entityType, Long entityId, String additionalInfo) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUser(user);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);

            // Handle null entityId - use user ID if available, otherwise use 0
            if (entityId == null) {
                if (user != null && "User".equals(entityType)) {
                    // For User-related actions, use the user's ID converted to Long
                    auditLog.setEntityId(user.getId().getMostSignificantBits());
                } else {
                    // For other cases, use 0 as default
                    auditLog.setEntityId(0L);
                }
            } else {
                auditLog.setEntityId(entityId);
            }

            auditLog.setAdditionalInfo(additionalInfo);
            auditLog.setTimestamp(LocalDateTime.now());

            // Get IP address and user agent from request
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                auditLog.setIpAddress(getClientIpAddress(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
            }

            auditLogRepository.save(auditLog);

        } catch (Exception e) {
            // Don't throw exception for audit logging failures
            // Silent fail - could add debug logging if needed
        }
    }

    public void logAction(User user, String action, String entityType, Long entityId,
                          String oldValues, String newValues, String additionalInfo) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUser(user);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);

            // Handle null entityId - use user ID if available, otherwise use 0
            if (entityId == null) {
                if (user != null && "User".equals(entityType)) {
                    // For User-related actions, use the user's ID converted to Long
                    auditLog.setEntityId(user.getId().getMostSignificantBits());
                } else {
                    // For other cases, use 0 as default
                    auditLog.setEntityId(0L);
                }
            } else {
                auditLog.setEntityId(entityId);
            }

            auditLog.setOldValues(oldValues);
            auditLog.setNewValues(newValues);
            auditLog.setAdditionalInfo(additionalInfo);
            auditLog.setTimestamp(LocalDateTime.now());

            // Get IP address and user agent from request
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                auditLog.setIpAddress(getClientIpAddress(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
            }

            auditLogRepository.save(auditLog);

        } catch (Exception e) {
            // Don't throw exception for audit logging failures
            // Silent fail - could add debug logging if needed
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            return xForwardedForHeader.split(",")[0];
        }
    }
}
