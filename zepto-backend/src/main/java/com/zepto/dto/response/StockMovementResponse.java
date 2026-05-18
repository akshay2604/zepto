package com.zepto.dto.response;

import com.zepto.entity.enums.MovementType;

import java.time.LocalDateTime;
import java.util.UUID;

public record StockMovementResponse(
        UUID         id,
        UUID         warehouseId,
        String       warehouseName,
        UUID         variantId,
        String       displayName,
        String       sku,
        MovementType movementType,
        int          qtyDelta,
        int          qtyOnHand,
        int          qtyAvailable,
        LocalDateTime createdAt
) {}
