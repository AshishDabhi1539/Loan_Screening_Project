package com.tss.loan.service.impl;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.tss.loan.entity.enums.BusinessEventType;
import com.tss.loan.entity.enums.NotificationPriority;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.enums.RecipientRole;
import com.tss.loan.service.NotificationRouter;

@Service
public class NotificationRouterImpl implements NotificationRouter {
    private final Map<BusinessEventType, List<Route>> policy = new HashMap<>();

    public NotificationRouterImpl() {
        // Applicant criticals
        policy.put(BusinessEventType.APPLICATION_SUBMITTED, Arrays.asList(
            new Route(RecipientRole.APPLICANT, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.IMPORTANT, "APPLICATION_SUBMITTED_APPLICANT")
        ));

        policy.put(BusinessEventType.APPLICATION_APPROVED, Arrays.asList(
            new Route(RecipientRole.APPLICANT, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.CRITICAL, "APPLICATION_APPROVED_APPLICANT")
        ));

        policy.put(BusinessEventType.APPLICATION_REJECTED, Arrays.asList(
            new Route(RecipientRole.APPLICANT, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.CRITICAL, "APPLICATION_REJECTED_APPLICANT")
        ));

        policy.put(BusinessEventType.DOCUMENT_REJECTED, Arrays.asList(
            new Route(RecipientRole.APPLICANT, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.IMPORTANT, "DOCUMENT_REJECTED_APPLICANT")
        ));

        // Officer assignments
        policy.put(BusinessEventType.NEW_ASSIGNMENT, Arrays.asList(
            new Route(RecipientRole.LOAN_OFFICER, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.IMPORTANT, "NEW_ASSIGNMENT_OFFICER")
        ));

        policy.put(BusinessEventType.URGENT_ASSIGNMENT, Arrays.asList(
            new Route(RecipientRole.LOAN_OFFICER, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.CRITICAL, "URGENT_ASSIGNMENT_OFFICER")
        ));

        // Compliance
        policy.put(BusinessEventType.COMPLIANCE_REVIEW_COMPLETED, Arrays.asList(
            new Route(RecipientRole.APPLICANT, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.IMPORTANT, "COMPLIANCE_REVIEW_COMPLETED_APPLICANT"),
            new Route(RecipientRole.COMPLIANCE_OFFICER, Arrays.asList(NotificationType.IN_APP), NotificationPriority.INFO, "COMPLIANCE_REVIEW_COMPLETED_INTERNAL")
        ));

        // Security
        policy.put(BusinessEventType.SECURITY_ALERT, Arrays.asList(
            new Route(RecipientRole.ADMIN, Arrays.asList(NotificationType.EMAIL, NotificationType.IN_APP), NotificationPriority.CRITICAL, "SECURITY_ALERT_ADMIN")
        ));
    }

    @Override
    public List<Route> resolve(BusinessEventType eventType) {
        return policy.getOrDefault(eventType, Collections.emptyList());
    }
}


