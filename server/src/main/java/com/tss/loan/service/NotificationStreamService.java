package com.tss.loan.service;

import java.util.UUID;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.tss.loan.dto.response.NotificationResponse;

public interface NotificationStreamService {
    SseEmitter register(UUID userId);
    void publish(UUID userId, NotificationResponse notification);
    void remove(UUID userId, SseEmitter emitter);
}


