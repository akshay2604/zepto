package com.zepto.service;

import com.zepto.dto.request.PaymentWebhookRequest;
import com.zepto.dto.response.OrderResponse;
import com.zepto.dto.response.PaymentResponse;
import com.zepto.entity.Order;
import com.zepto.entity.Payment;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.PaymentStatus;
import com.zepto.repository.PaymentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentWebhookService {

    private final PaymentRepository      paymentRepository;
    private final OrderLifecycleService  lifecycle;

    public OrderResponse handleWebhook(PaymentWebhookRequest req) {
        Order order = lifecycle.findOrder(req.orderId());

        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new IllegalStateException(
                    "Payment webhook received for order in status " + order.getStatus()
                    + " — expected PLACED or PAYMENT_PENDING");
        }

        Payment payment = paymentRepository.findByOrderId(req.orderId())
                .orElseThrow(() -> new EntityNotFoundException("Payment not found for order: " + req.orderId()));

        PaymentStatus incoming = parseStatus(req.status());
        payment.setStatus(incoming);
        payment.setGatewayTxnId(req.gatewayTxnId());

        if (incoming == PaymentStatus.SUCCESS) {
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);
            log.info("[PAYMENT] {} SUCCESS via {} | txn={}", req.orderId(), payment.getMethod(), req.gatewayTxnId());
            return lifecycle.confirm(req.orderId());
        } else {
            paymentRepository.save(payment);
            log.info("[PAYMENT] {} FAILED — cancelling order", req.orderId());
            return lifecycle.cancel(req.orderId());
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID orderId) {
        lifecycle.findOrder(orderId); // validates order exists
        Payment p = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found for order: " + orderId));
        return toResponse(p);
    }

    private PaymentStatus parseStatus(String raw) {
        try {
            return PaymentStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown payment status: " + raw + " — expected SUCCESS or FAILED");
        }
    }

    static PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getOrder().getId(),
                p.getMethod(),
                p.getStatus(),
                p.getAmount(),
                p.getGatewayTxnId(),
                p.getPaidAt()
        );
    }
}
