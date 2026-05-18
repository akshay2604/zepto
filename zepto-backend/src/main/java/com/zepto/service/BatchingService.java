package com.zepto.service;

import com.zepto.dto.response.PickBatchItemResponse;
import com.zepto.dto.response.PickBatchResponse;
import com.zepto.entity.*;
import com.zepto.entity.enums.BatchStatus;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.ZoneType;
import com.zepto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BatchingService {

    private static final int MAX_BATCH_SIZE = 5;

    private final OrderRepository         orderRepository;
    private final OrderItemRepository     orderItemRepository;
    private final PickBatchRepository     pickBatchRepository;
    private final PickBatchOrderRepository pickBatchOrderRepository;
    private final PickBatchItemRepository pickBatchItemRepository;
    private final WarehouseRepository     warehouseRepository;
    private final CategoryZoneResolver    zoneResolver;

    public List<PickBatchResponse> formBatches(UUID warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Warehouse not found: " + warehouseId));

        // Orders already in a non-COMPLETE batch are skipped
        Set<UUID> alreadyBatched = pickBatchOrderRepository
                .findAlreadyBatchedOrderIds(warehouseId, BatchStatus.COMPLETE);

        List<Order> eligible = orderRepository.findByStatus(OrderStatus.CONFIRMED).stream()
                .filter(o -> o.getWarehouse().getId().equals(warehouseId))
                .filter(o -> !alreadyBatched.contains(o.getId()))
                .sorted(Comparator.comparing(Order::getPlacedAt))
                .collect(Collectors.toCollection(ArrayList::new));

        if (eligible.isEmpty()) {
            log.info("[BATCH] No eligible CONFIRMED orders for warehouse {}", warehouseId);
            return List.of();
        }

        // Build zone sets per order
        Map<UUID, Set<ZoneType>> orderZones = new LinkedHashMap<>();
        Map<UUID, List<OrderItem>> orderItems = new LinkedHashMap<>();
        for (Order order : eligible) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            orderItems.put(order.getId(), items);
            Set<ZoneType> zones = items.stream()
                    .map(i -> zoneResolver.resolve(i.getVariant().getProduct().getCategory()))
                    .collect(Collectors.toCollection(() -> EnumSet.noneOf(ZoneType.class)));
            orderZones.put(order.getId(), zones);
        }

        List<PickBatchResponse> formed = new ArrayList<>();
        Set<UUID> assigned = new HashSet<>();

        for (Order seed : eligible) {
            if (assigned.contains(seed.getId())) continue;

            List<Order> batchOrders = new ArrayList<>();
            batchOrders.add(seed);
            assigned.add(seed.getId());
            Set<ZoneType> batchZones = EnumSet.copyOf(orderZones.get(seed.getId()));

            for (Order candidate : eligible) {
                if (assigned.contains(candidate.getId())) continue;
                if (batchOrders.size() >= MAX_BATCH_SIZE) break;
                Set<ZoneType> candidateZones = orderZones.get(candidate.getId());
                // Add if shares at least one zone with current batch
                if (!Collections.disjoint(batchZones, candidateZones)) {
                    batchOrders.add(candidate);
                    assigned.add(candidate.getId());
                    batchZones.addAll(candidateZones);
                }
            }

            PickBatch batch = pickBatchRepository.save(PickBatch.builder()
                    .warehouse(warehouse)
                    .status(BatchStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build());

            for (Order o : batchOrders) {
                pickBatchOrderRepository.save(PickBatchOrder.builder()
                        .batch(batch)
                        .order(o)
                        .build());
            }

            List<PickBatchItem> items = buildPickItems(batch, batchOrders, orderItems);
            pickBatchItemRepository.saveAll(items);

            // Reload to get batchOrders populated
            PickBatch reloaded = pickBatchRepository.findById(batch.getId()).orElseThrow();
            List<PickBatchItemResponse> itemResponses = items.stream()
                    .map(PickBatchItemResponse::from)
                    .toList();
            formed.add(PickBatchResponse.from(reloaded, itemResponses));

            log.info("[BATCH] Formed batch {} with {} orders, zones: {}", batch.getId(), batchOrders.size(), batchZones);
        }

        return formed;
    }

    private List<PickBatchItem> buildPickItems(PickBatch batch, List<Order> orders,
                                               Map<UUID, List<OrderItem>> orderItemsMap) {
        record SortableItem(ZoneType zone, String skuCode, Order order, OrderItem item) {}

        List<SortableItem> sortable = new ArrayList<>();
        for (Order order : orders) {
            for (OrderItem item : orderItemsMap.get(order.getId())) {
                ZoneType zone = zoneResolver.resolve(item.getVariant().getProduct().getCategory());
                sortable.add(new SortableItem(zone, item.getVariant().getSkuCode(), order, item));
            }
        }

        // Sort: zone display_order (PRODUCE=1, CHILLED=2, FROZEN=3, AMBIENT=4) then SKU for serpentine route
        sortable.sort(Comparator.comparingInt((SortableItem s) -> s.zone().ordinal())
                .thenComparing(s -> s.skuCode()));

        List<PickBatchItem> result = new ArrayList<>();
        for (int i = 0; i < sortable.size(); i++) {
            SortableItem s = sortable.get(i);
            result.add(PickBatchItem.builder()
                    .batch(batch)
                    .order(s.order())
                    .orderItem(s.item())
                    .variant(s.item().getVariant())
                    .zoneType(s.zone())
                    .sortOrder(i)
                    .qty(s.item().getQty())
                    .picked(false)
                    .build());
        }
        return result;
    }
}
