package com.tss.loan.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.tss.loan.dto.response.NotificationResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.service.NotificationService;
import com.tss.loan.service.NotificationStreamService;
import com.tss.loan.service.UserService;
import com.tss.loan.entity.enums.NotificationType;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationStreamService notificationStreamService;

    @Autowired
    private UserService userService;

    @GetMapping
    public Page<NotificationResponse> list(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size,
                                           @RequestParam(required = false) Boolean isRead,
                                           @RequestParam(required = false) NotificationType type) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        return notificationService.list(user, isRead, type, pageable).map(NotificationResponse::fromEntity);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount() {
        User user = getCurrentUser();
        return ResponseEntity.ok(notificationService.getUnreadCount(user));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount() {
        User user = getCurrentUser();
        return ResponseEntity.ok(notificationService.getUnreadCount(user));
    }

    @GetMapping("/unread")
    public Page<NotificationResponse> getUnread(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        return notificationService.list(user, false, null, pageable).map(NotificationResponse::fromEntity);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable("id") Long id) {
        User user = getCurrentUser();
        notificationService.markAsRead(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        User user = getCurrentUser();
        notificationService.markAllAsRead(user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-selected")
    public ResponseEntity<Integer> markSelectedRead(@RequestBody List<Long> ids) {
        User user = getCurrentUser();
        int updated = notificationService.markSelectedAsRead(user, ids);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/stream")
    public SseEmitter stream() {
        User user = getCurrentUser();
        return notificationStreamService.register(user.getId());
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userService.findByEmail(email);
    }
}


