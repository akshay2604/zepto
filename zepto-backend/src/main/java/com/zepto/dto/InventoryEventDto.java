package com.zepto.dto;

import com.zepto.entity.enums.MovementType;

import java.time.LocalDateTime;
import java.util.UUID;

/** Pushed to the /stream/inventory SSE channel after every stock movement. */
public record InventoryEventDto(
        UUID         variantId,
        String       sku,
        String       displayName,
        MovementType movementType,
        int          qtyDelta,
        int          qtyOnHand,
        int          qtyAvailable,
        UUID         warehouseId,
        String       warehouseName,
        LocalDateTime timestamp
) {}
