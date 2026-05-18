package com.zepto.dto;

import java.util.UUID;

public record InventoryStatusDto(
        UUID   variantId,
        String displayName,
        String sku,
        int    qtyOnHand,
        int    qtyReserved,
        int    qtyAvailable,
        boolean lowStock
) {}
