package com.zepto.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseEmitterService {

    private final Map<String, List<SseEmitter>> registry = new ConcurrentHashMap<>();

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    public SseEmitter subscribe(String stream) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        List<SseEmitter> list = registry.computeIfAbsent(stream, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);

        emitter.onCompletion(() -> list.remove(emitter));
        emitter.onTimeout(() -> { emitter.complete(); list.remove(emitter); });
        emitter.onError(e -> list.remove(emitter));

        log.debug("[SSE] Client subscribed to '{}' ({} total)", stream, list.size());
        return emitter;
    }

    public void publish(String stream, String eventName, Object payload) {
        List<SseEmitter> list = registry.getOrDefault(stream, List.of());
        if (list.isEmpty()) return;

        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        if (!dead.isEmpty()) list.removeAll(dead);
    }

    public long activeEmitterCount() {
        return registry.values().stream().mapToLong(List::size).sum();
    }
}
