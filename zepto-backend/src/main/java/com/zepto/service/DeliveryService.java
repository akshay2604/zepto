package com.zepto.service;

import com.zepto.dto.request.AssignRiderRequest;
import com.zepto.dto.response.DeliveryResponse;
import com.zepto.dto.response.OrderResponse;
import com.zepto.entity.Delivery;
import com.zepto.entity.Order;
import com.zepto.entity.Payment;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.PaymentStatus;
import com.zepto.repository.DeliveryRepository;
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
public class DeliveryService {

    private final DeliveryRepository    deliveryRepository;
    private final PaymentRepository     paymentRepository;
    private final OrderLifecycleService lifecycle;

    /** Assigns a rider to a PACKED order and creates the Delivery record. */
    public DeliveryResponse assignRider(UUID orderId, AssignRiderRequest req) {
        Order order = lifecycle.findOrder(orderId);
        lifecycle.requireStatus(order, OrderStatus.PACKED);

        if (deliveryRepository.findByOrderId(orderId).isPresent()) {
            throw new IllegalStateException("Rider already assigned for order: " + orderId);
        }

        Delivery delivery = deliveryRepository.save(Delivery.builder()
                .order(order)
                .riderName(req.riderName())
                .riderPhone(req.riderPhone())
                .status("ASSIGNED")
                .assignedAt(LocalDateTime.now())
                .build());

        log.info("[DELIVERY] Rider {} assigned to order {}", req.riderName(), orderId);
        return toResponse(delivery);
    }

    /** Rider picks up from warehouse → order moves to OUT_FOR_DELIVERY. */
    public OrderResponse markOutForDelivery(UUID orderId) {
        Order order = lifecycle.findOrder(orderId);
        lifecycle.requireStatus(order, OrderStatus.PACKED);

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalStateException(
                        "No rider assigned for order " + orderId + " — call assign-rider first"));

        delivery.setStatus("OUT_FOR_DELIVERY");
        delivery.setPickedUpAt(LocalDateTime.now());
        deliveryRepository.save(delivery);

        return lifecycle.transition(order, OrderStatus.OUT_FOR_DELIVERY);
    }

    /** Rider completes delivery → DELIVERED. Marks COD payment SUCCESS. */
    public OrderResponse completeDelivery(UUID orderId) {
        Order order = lifecycle.findOrder(orderId);
        lifecycle.requireStatus(order, OrderStatus.OUT_FOR_DELIVERY);

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Delivery record not found for order: " + orderId));

        LocalDateTime now = LocalDateTime.now();
        long secs = java.time.Duration.between(delivery.getAssignedAt(), now).getSeconds();

        delivery.setStatus("DELIVERED");
        delivery.setDeliveredAt(now);
        delivery.setDeliveryTimeSecs((int) secs);
        deliveryRepository.save(delivery);

        // COD: collect payment at doorstep
        paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
            if ("COD".equalsIgnoreCase(payment.getMethod()) && payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(now);
                paymentRepository.save(payment);
                log.info("[PAYMENT] COD collected for order {}", orderId);
            }
        });

        return lifecycle.transition(order, OrderStatus.DELIVERED);
    }

    @Transactional(readOnly = true)
    public DeliveryResponse getDelivery(UUID orderId) {
        lifecycle.findOrder(orderId);
        return deliveryRepository.findByOrderId(orderId)
                .map(DeliveryService::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("No delivery record for order: " + orderId));
    }

    static DeliveryResponse toResponse(Delivery d) {
        return new DeliveryResponse(
                d.getId(), d.getOrder().getId(),
                d.getRiderName(), d.getRiderPhone(), d.getStatus(),
                d.getAssignedAt(), d.getPickedUpAt(), d.getDeliveredAt(),
                d.getDeliveryTimeSecs()
        );
    }
}
