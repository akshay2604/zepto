package com.zepto.dto.response;

import java.util.UUID;

public record InventoryLedgerResponse(
        UUID   ledgerId,
        UUID   warehouseId,
        String warehouseName,
        UUID   variantId,
        String displayName,
        String skuCode,
        int    qtyOnHand,
        int    qtyReserved,
        int    qtyAvailable,
        int    reorderThreshold,
        boolean lowStock
) {}
