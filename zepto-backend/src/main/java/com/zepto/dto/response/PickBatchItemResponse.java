package com.zepto.dto.response;

import com.zepto.entity.PickBatchItem;
import com.zepto.entity.enums.ZoneType;

import java.time.LocalDateTime;
import java.util.UUID;

public record PickBatchItemResponse(
        UUID          id,
        UUID          orderId,
        UUID          orderItemId,
        UUID          variantId,
        String        displayName,
        String        sku,
        ZoneType      zoneType,
        int           qty,
        boolean       picked,
        LocalDateTime pickedAt,
        int           sortOrder
) {
    public static PickBatchItemResponse from(PickBatchItem i) {
        return new PickBatchItemResponse(
                i.getId(),
                i.getOrder().getId(),
                i.getOrderItem().getId(),
                i.getVariant().getId(),
                i.getVariant().getDisplayName(),
                i.getVariant().getSkuCode(),
                i.getZoneType(),
                i.getQty(),
                i.isPicked(),
                i.getPickedAt(),
                i.getSortOrder()
        );
    }
}
