package com.tss.loan.service.impl;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tss.loan.dto.response.NotificationResponse;
import com.tss.loan.service.NotificationStreamService;

@Service
public class NotificationStreamServiceImpl implements NotificationStreamService {
    private final Map<UUID, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public SseEmitter register(UUID userId) {
        SseEmitter emitter = new SseEmitter(0L);
        userEmitters.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(e -> remove(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok", MediaType.TEXT_PLAIN));
        } catch (IOException ignored) { }

        return emitter;
    }

    @Override
    public void publish(UUID userId, NotificationResponse notification) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(notification);
        } catch (Exception ex) {
            return;
        }

        emitters.removeIf(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("notification").data(payload, MediaType.APPLICATION_JSON));
                return false;
            } catch (IOException e) {
                emitter.complete();
                return true;
            }
        });
    }

    @Override
    public void remove(UUID userId, SseEmitter emitter) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }
}


