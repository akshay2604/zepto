package com.zepto.service;

import com.zepto.dto.response.ZoneResponse;
import com.zepto.entity.Zone;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.ZoneType;
import com.zepto.repository.OrderItemRepository;
import com.zepto.repository.OrderRepository;
import com.zepto.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZoneService {

    private final ZoneRepository       zoneRepository;
    private final OrderRepository      orderRepository;
    private final OrderItemRepository  orderItemRepository;
    private final CategoryZoneResolver zoneResolver;

    public List<ZoneResponse> getZones(UUID warehouseId) {
        List<Zone> zones = zoneRepository.findByWarehouseIdOrderByDisplayOrderAsc(warehouseId);

        // Count CONFIRMED orders touching each zone
        Map<ZoneType, Integer> counts = buildZoneOrderCounts(warehouseId);

        return zones.stream()
                .map(z -> ZoneResponse.from(z, counts.getOrDefault(z.getZoneType(), 0)))
                .toList();
    }

    private Map<ZoneType, Integer> buildZoneOrderCounts(UUID warehouseId) {
        List<com.zepto.entity.Order> confirmed = orderRepository.findByStatus(OrderStatus.CONFIRMED)
                .stream()
                .filter(o -> o.getWarehouse().getId().equals(warehouseId))
                .toList();

        Map<ZoneType, Set<UUID>> zoneOrders = new EnumMap<>(ZoneType.class);
        for (com.zepto.entity.Order order : confirmed) {
            orderItemRepository.findByOrderId(order.getId()).forEach(item -> {
                String catName = item.getVariant().getProduct().getCategory().getName();
                ZoneType zone  = zoneResolver.resolve(catName);
                zoneOrders.computeIfAbsent(zone, k -> new HashSet<>()).add(order.getId());
            });
        }

        Map<ZoneType, Integer> result = new EnumMap<>(ZoneType.class);
        zoneOrders.forEach((z, orders) -> result.put(z, orders.size()));
        return result;
    }
}
