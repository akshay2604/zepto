package com.zepto.sse;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/stream")
@RequiredArgsConstructor
public class SseController {

    private final SseEmitterService sseEmitterService;

    /** Customer + picker + rider: order status change events. */
    @GetMapping("/orders")
    public SseEmitter streamOrders() {
        return sseEmitterService.subscribe("orders");
    }

    /** Warehouse + admin: every stock movement (reserve, pick, inbound, cancel). */
    @GetMapping("/inventory")
    public SseEmitter streamInventory() {
        return sseEmitterService.subscribe("inventory");
    }


}
