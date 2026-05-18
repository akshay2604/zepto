package com.zepto.controller;

import com.zepto.dto.*;
import com.zepto.entity.InventoryLedger;
import com.zepto.entity.StockMovement;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final InventoryLedgerRepository inventoryLedgerRepository;
    private final OrderRepository           orderRepository;
    private final DeliveryRepository        deliveryRepository;
    private final OrderItemRepository       orderItemRepository;
    private final StockMovementRepository   stockMovementRepository;

    /**
     * GET /analytics/inventory-status
     * Full stock position for every variant across all warehouses.
     */
    @GetMapping("/inventory-status")
    public ResponseEntity<List<InventoryStatusDto>> getInventoryStatus() {
        List<InventoryLedger> ledgers = inventoryLedgerRepository.findAllWithVariantAndWarehouse();

        List<InventoryStatusDto> result = ledgers.stream()
                .map(l -> new InventoryStatusDto(
                        l.getVariant().getId(),
                        l.getVariant().getDisplayName(),
                        l.getVariant().getSkuCode(),
                        l.getQtyOnHand(),
                        l.getQtyReserved(),
                        l.getQtyAvailable(),
                        l.getQtyOnHand() <= l.getReorderThreshold()
                ))
                .sorted(Comparator.comparing(InventoryStatusDto::displayName))
                .toList();

        return ResponseEntity.ok(result);
    }

    /**
     * GET /analytics/order-funnel
     * Count of orders per status — useful for a pipeline visualisation.
     */
    @GetMapping("/order-funnel")
    public ResponseEntity<OrderFunnelDto> getOrderFunnel() {
        List<Object[]> rows = orderRepository.countGroupedByStatus();

        Map<String, Long> countByStatus = new LinkedHashMap<>();
        // Pre-populate all statuses with zero so the funnel is always complete
        for (OrderStatus status : OrderStatus.values()) {
            countByStatus.put(status.name(), 0L);
        }
        for (Object[] row : rows) {
            OrderStatus status = (OrderStatus) row[0];
            Long count         = (Long) row[1];
            countByStatus.put(status.name(), count);
        }

        return ResponseEntity.ok(new OrderFunnelDto(countByStatus));
    }

    /**
     * GET /analytics/avg-delivery-time
     * Average end-to-end delivery time across all completed deliveries.
     */
    @GetMapping("/avg-delivery-time")
    public ResponseEntity<AvgDeliveryTimeDto> getAvgDeliveryTime() {
        List<Object[]> rows = deliveryRepository.findAvgDeliveryTimeStats();
        Object[] stats = rows.isEmpty() ? new Object[]{null, 0L} : rows.get(0);
        double avg   = stats[0] != null ? ((Number) stats[0]).doubleValue() : 0.0;
        long   total = stats[1] != null ? ((Number) stats[1]).longValue()   : 0L;
        return ResponseEntity.ok(new AvgDeliveryTimeDto(avg, total));
    }

    /**
     * GET /analytics/top-variants
     * Top 5 variants by total qty sold in DELIVERED orders.
     */
    @GetMapping("/top-variants")
    public ResponseEntity<List<TopVariantDto>> getTopVariants() {
        List<Object[]> rows = orderItemRepository.findTopVariantsByOrderStatus(
                OrderStatus.DELIVERED, PageRequest.of(0, 5));

        List<TopVariantDto> result = rows.stream()
                .map(row -> new TopVariantDto(
                        (UUID)   row[0],
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).longValue()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    /**
     * GET /analytics/movement-audit
     * Last 20 stock movements with variant context for warehouse ops review.
     */
    @GetMapping("/movement-audit")
    public ResponseEntity<List<MovementAuditDto>> getMovementAudit() {
        List<StockMovement> movements =
            stockMovementRepository.findRecentWithVariant(PageRequest.of(0, 20));

        List<MovementAuditDto> result = movements.stream()
                .map(m -> new MovementAuditDto(
                        m.getId(),
                        m.getVariant().getDisplayName(),
                        m.getVariant().getSkuCode(),
                        m.getMovementType().name(),
                        m.getQtyDelta(),
                        m.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }
}
