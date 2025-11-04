package com.tss.loan.events;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tss.loan.entity.enums.BusinessEventType;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.system.Notification;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.UserRepository;
import com.tss.loan.repository.NotificationRepository;
import com.tss.loan.service.EmailService;
import com.tss.loan.service.NotificationRouter;
import com.tss.loan.service.NotificationService;
import com.tss.loan.service.TemplateService;

@Component
public class NotificationEventListener {
    @Autowired
    private NotificationRouter router;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private TemplateService templateService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @EventListener
    public void onDomainEvent(NotificationDomainEvent event) {
        BusinessEventType eventType = event.getEventType();
        Map<String, Object> vars = event.getVariables();

        // For this simple listener, we assume a single resolved recipient userId per event
        User user = userRepository.findById(event.getRecipientUserId()).orElse(null);
        if (user == null) return;

        List<NotificationRouter.Route> routes = router.resolve(eventType);
        for (NotificationRouter.Route route : routes) {
            deliver(user, route, eventType, vars);
        }
    }

    private void deliver(User user, NotificationRouter.Route route, BusinessEventType eventType, Map<String, Object> vars) {
        String title = templateService.subject(route.templateCode, vars);
        String message = templateService.render(route.templateCode, vars);
        String metadataJson = serialize(vars);

        for (NotificationType channel : route.channels) {
            Notification n = notificationService.createNotification(user, channel, title, message);
            n.setPriority(route.priority);
            n.setRecipientRole(route.role);
            n.setCreatedByEvent(eventType.name());
            n.setMetadataJson(metadataJson);
            notificationRepository.save(n);

            if (channel == NotificationType.EMAIL) {
                emailService.sendGenericHtml(user.getEmail(), title, message, user, eventType.name());
            }
        }
    }

    private String serialize(Map<String, Object> vars) {
        if (vars == null) return null;
        try { return objectMapper.writeValueAsString(vars); } catch (JsonProcessingException e) { return null; }
    }
}


