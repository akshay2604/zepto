package com.zepto.controller;

import com.zepto.dto.request.PaymentWebhookRequest;
import com.zepto.dto.response.OrderResponse;
import com.zepto.service.PaymentWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentWebhookService paymentWebhookService;

    /**
     * Simulated payment gateway callback.
     * On SUCCESS → advances order to CONFIRMED.
     * On FAILED  → cancels order and releases inventory.
     */
    @PostMapping("/webhook")
    public ResponseEntity<OrderResponse> webhook(@Valid @RequestBody PaymentWebhookRequest req) {
        return ResponseEntity.ok(paymentWebhookService.handleWebhook(req));
    }
}
