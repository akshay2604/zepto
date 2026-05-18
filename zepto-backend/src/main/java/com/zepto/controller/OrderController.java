package com.zepto.controller;

import com.zepto.dto.request.AssignPickerRequest;
import com.zepto.dto.request.AssignRiderRequest;
import com.zepto.dto.request.PlaceOrderRequest;
import com.zepto.dto.response.DeliveryResponse;
import com.zepto.dto.response.OrderResponse;
import com.zepto.dto.response.PagedResponse;
import com.zepto.dto.response.PaymentResponse;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.service.DeliveryService;
import com.zepto.service.OrderLifecycleService;
import com.zepto.service.OrderService;
import com.zepto.service.PaymentWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService          orderService;
    private final OrderLifecycleService lifecycle;
    private final DeliveryService       deliveryService;
    private final PaymentWebhookService paymentWebhookService;

    // ── Core ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody PlaceOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(req));
    }

    /** Filterable order list. All params optional; defaults to page 0, size 20, newest first. */
    @GetMapping
    public ResponseEntity<PagedResponse<OrderResponse>> listOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.listOrders(status, warehouseId, userId, from, to, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    // ── Order lifecycle ───────────────────────────────────────────────────────

    @PostMapping("/{id}/confirm")
    public ResponseEntity<OrderResponse> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(lifecycle.confirm(id));
    }

    @PostMapping("/{id}/start-picking")
    public ResponseEntity<OrderResponse> startPicking(@PathVariable UUID id) {
        return ResponseEntity.ok(lifecycle.startPicking(id));
    }

    @PostMapping("/{id}/assign-picker")
    public ResponseEntity<OrderResponse> assignPicker(
            @PathVariable UUID id,
            @Valid @RequestBody AssignPickerRequest req) {
        return ResponseEntity.ok(lifecycle.assignPicker(id, req.pickerId()));
    }

    @PostMapping("/{id}/pack")
    public ResponseEntity<OrderResponse> pack(@PathVariable UUID id) {
        return ResponseEntity.ok(lifecycle.pack(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(lifecycle.cancel(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable UUID id) {
        lifecycle.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    // ── Delivery / rider ──────────────────────────────────────────────────────

    @PostMapping("/{id}/assign-rider")
    public ResponseEntity<DeliveryResponse> assignRider(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRiderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deliveryService.assignRider(id, req));
    }

    @PostMapping("/{id}/out-for-delivery")
    public ResponseEntity<OrderResponse> outForDelivery(@PathVariable UUID id) {
        return ResponseEntity.ok(deliveryService.markOutForDelivery(id));
    }

    @PostMapping("/{id}/deliver")
    public ResponseEntity<OrderResponse> deliver(@PathVariable UUID id) {
        return ResponseEntity.ok(deliveryService.completeDelivery(id));
    }

    @GetMapping("/{id}/delivery")
    public ResponseEntity<DeliveryResponse> getDelivery(@PathVariable UUID id) {
        return ResponseEntity.ok(deliveryService.getDelivery(id));
    }

    // ── Payment ───────────────────────────────────────────────────────────────

    @GetMapping("/{id}/payment")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentWebhookService.getPayment(id));
    }
}
