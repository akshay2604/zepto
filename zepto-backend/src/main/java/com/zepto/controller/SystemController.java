package com.zepto.controller;

import com.zepto.dto.SystemStatusDto;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.repository.OrderRepository;
import com.zepto.repository.StockMovementRepository;
import com.zepto.sse.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
public class SystemController {

    private final OrderRepository         orderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SseEmitterService       sseEmitterService;

    @GetMapping("/status")
    public ResponseEntity<SystemStatusDto> getStatus() {
        return ResponseEntity.ok(new SystemStatusDto(
                false,
                orderRepository.count(),
                orderRepository.countByStatus(OrderStatus.DELIVERED),
                stockMovementRepository.count(),
                sseEmitterService.activeEmitterCount()
        ));
    }
}
