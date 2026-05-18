package com.zepto.service;

import com.zepto.dto.InventoryEventDto;
import com.zepto.dto.OrderEventDto;
import com.zepto.dto.response.OrderResponse;
import com.zepto.entity.*;
import com.zepto.entity.enums.MovementType;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.repository.*;
import com.zepto.sse.SseEmitterService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderLifecycleService {

    private static final Set<OrderStatus> TERMINAL =
            EnumSet.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED);

    private final OrderRepository           orderRepository;
    private final OrderItemRepository       orderItemRepository;
    private final PaymentRepository         paymentRepository;
    private final InventoryLedgerRepository ledgerRepository;
    private final StockMovementRepository   stockMovementRepository;
    private final SseEmitterService         sseEmitterService;
    private final OrderService              orderService;
    private final PickerRepository          pickerRepository;

    public OrderResponse confirm(UUID orderId) {
        Order order = findOrder(orderId);
        requireStatus(order, OrderStatus.PLACED, OrderStatus.PAYMENT_PENDING);
        return transition(order, OrderStatus.CONFIRMED);
    }

    public OrderResponse startPicking(UUID orderId) {
        Order order = findOrder(orderId);
        requireStatus(order, OrderStatus.CONFIRMED);
        return transition(order, OrderStatus.PICKING);
    }

    /** Assigns a picker and transitions CONFIRMED → PICKING in one step. */
    public OrderResponse assignPicker(UUID orderId, UUID pickerId) {
        Order order = findOrder(orderId);
        requireStatus(order, OrderStatus.CONFIRMED);
        Picker picker = pickerRepository.findById(pickerId)
                .orElseThrow(() -> new EntityNotFoundException("Picker not found: " + pickerId));
        order.setPicker(picker);
        orderRepository.save(order);
        return transition(order, OrderStatus.PICKING);
    }

    /** Advances to PACKED and physically deducts reserved stock from on-hand. */
    public OrderResponse pack(UUID orderId) {
        Order order = findOrder(orderId);
        requireStatus(order, OrderStatus.PICKING);
        pickItems(order);
        return transition(order, OrderStatus.PACKED);
    }

    /** Cancels the order from any non-terminal status and releases all reserved inventory. */
    public OrderResponse cancel(UUID orderId) {
        Order order = findOrder(orderId);
        if (TERMINAL.contains(order.getStatus())) {
            throw new IllegalStateException("Order " + orderId + " is already " + order.getStatus());
        }
        releaseReservations(order);
        return transition(order, OrderStatus.CANCELLED);
    }

    /** Hard-deletes an order. Cancels first if not terminal to release reserved inventory. */
    public void deleteOrder(UUID orderId) {
        Order order = findOrder(orderId);
        if (!TERMINAL.contains(order.getStatus())) {
            releaseReservations(order);
        }
        stockMovementRepository.deleteByReferenceId(orderId);
        orderRepository.delete(order);
        log.info("[ORDER] {} deleted", orderId);
    }

    // ── Package-private: called by PaymentWebhookService and DeliveryService ──

    Order findOrder(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));
    }

    OrderResponse transition(Order order, OrderStatus next) {
        order.setStatus(next);
        Order saved = orderRepository.save(order);

        sseEmitterService.publish("orders", "order-update", new OrderEventDto(
                saved.getId(),
                saved.getUser().getName(),
                next,
                saved.getAmountPayable(),
                orderItemRepository.findByOrderId(saved.getId()).size(),
                saved.getWarehouse().getId(),
                saved.getWarehouse().getName(),
                saved.getPicker() != null ? saved.getPicker().getName() : null,
                LocalDateTime.now()
        ));

        log.info("[ORDER] {} → {}", saved.getId(), next);
        return orderService.toResponse(saved);
    }

    // ── Inventory helpers ─────────────────────────────────────────────────────

    private void pickItems(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            InventoryLedger ledger = ledgerRepository
                    .findByWarehouseIdAndVariantIdWithLock(
                            order.getWarehouse().getId(), item.getVariant().getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "No ledger for variant " + item.getVariant().getSkuCode()));

            ledger.setQtyOnHand(ledger.getQtyOnHand() - item.getQty());
            ledger.setQtyReserved(ledger.getQtyReserved() - item.getQty());
            ledger.setLastUpdated(LocalDateTime.now());
            ledgerRepository.save(ledger);

            stockMovementRepository.save(StockMovement.builder()
                    .warehouse(order.getWarehouse())
                    .variant(item.getVariant())
                    .movementType(MovementType.ORDER_PICK)
                    .qtyDelta(-item.getQty())
                    .referenceId(order.getId())
                    .build());

            sseEmitterService.publish("inventory", "inventory-update", new InventoryEventDto(
                    item.getVariant().getId(), item.getVariant().getSkuCode(), item.getVariant().getDisplayName(),
                    MovementType.ORDER_PICK, -item.getQty(),
                    ledger.getQtyOnHand(), ledger.getQtyAvailable(),
                    order.getWarehouse().getId(), order.getWarehouse().getName(),
                    LocalDateTime.now()
            ));
        }
    }

    private void releaseReservations(Order order) {
        // Only release if inventory was actually reserved (order got past PLACED)
        if (order.getStatus() == OrderStatus.PLACED || order.getStatus() == OrderStatus.PAYMENT_PENDING) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                ledgerRepository
                        .findByWarehouseIdAndVariantIdWithLock(
                                order.getWarehouse().getId(), item.getVariant().getId())
                        .ifPresent(ledger -> {
                            ledger.setQtyReserved(ledger.getQtyReserved() - item.getQty());
                            ledger.setLastUpdated(LocalDateTime.now());
                            ledgerRepository.save(ledger);

                            stockMovementRepository.save(StockMovement.builder()
                                    .warehouse(order.getWarehouse())
                                    .variant(item.getVariant())
                                    .movementType(MovementType.ORDER_CANCEL)
                                    .qtyDelta(item.getQty())
                                    .referenceId(order.getId())
                                    .build());

                            sseEmitterService.publish("inventory", "inventory-update", new InventoryEventDto(
                                    item.getVariant().getId(), item.getVariant().getSkuCode(), item.getVariant().getDisplayName(),
                                    MovementType.ORDER_CANCEL, item.getQty(),
                                    ledger.getQtyOnHand(), ledger.getQtyAvailable(),
                                    order.getWarehouse().getId(), order.getWarehouse().getName(),
                                    LocalDateTime.now()
                            ));
                        });
            }
        }
    }

    // ── Validation ────────────────────────────────────────────────────────────

    void requireStatus(Order order, OrderStatus... allowed) {
        for (OrderStatus s : allowed) {
            if (order.getStatus() == s) return;
        }
        throw new IllegalStateException(
                "Order " + order.getId() + " is " + order.getStatus()
                + " — expected one of: " + java.util.Arrays.toString(allowed));
    }
}
