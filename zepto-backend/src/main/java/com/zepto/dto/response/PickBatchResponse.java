package com.zepto.dto.response;

import com.zepto.entity.PickBatch;
import com.zepto.entity.PickBatchOrder;
import com.zepto.entity.enums.BatchStatus;
import com.zepto.entity.enums.ZoneType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PickBatchResponse(
        UUID                       id,
        UUID                       warehouseId,
        UUID                       pickerId,
        String                     pickerName,
        BatchStatus                status,
        int                        orderCount,
        List<ZoneType>             zonesCovered,
        LocalDateTime              createdAt,
        LocalDateTime              completedAt,
        List<UUID>                 orderIds,
        List<PickBatchItemResponse> items
) {
    public static PickBatchResponse from(PickBatch b, List<PickBatchItemResponse> items) {
        List<ZoneType> zones = items.stream()
                .map(PickBatchItemResponse::zoneType)
                .distinct()
                .sorted()
                .toList();
        List<UUID> orderIds = b.getBatchOrders().stream()
                .map(bo -> bo.getOrder().getId())
                .toList();
        return new PickBatchResponse(
                b.getId(),
                b.getWarehouse().getId(),
                b.getPicker() != null ? b.getPicker().getId() : null,
                b.getPicker() != null ? b.getPicker().getName() : null,
                b.getStatus(),
                orderIds.size(),
                zones,
                b.getCreatedAt(),
                b.getCompletedAt(),
                orderIds,
                items
        );
    }
}
