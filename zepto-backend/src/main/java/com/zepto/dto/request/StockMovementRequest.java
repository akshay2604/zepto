package com.zepto.dto.request;

import com.zepto.entity.enums.MovementType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockMovementRequest(

        @NotNull UUID warehouseId,
        @NotNull UUID variantId,

        // Only INBOUND, SPOILAGE, ADJUSTMENT accepted externally.
        // ORDER_* types are driven internally by the order service.
        @NotNull MovementType movementType,

        // Signed delta applied to qty_on_hand.
        // INBOUND: positive. SPOILAGE: negative. ADJUSTMENT: any non-zero.
        int qtyDelta,

        UUID referenceId   // optional: supplier PO ID, spoilage report ID, etc.
) {}
