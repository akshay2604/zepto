package com.zepto.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record VariantResponse(
        UUID       id,
        String     skuCode,
        String     displayName,
        String     packSize,
        String     unit,
        BigDecimal mrp,
        BigDecimal sellingPrice,
        String     imageUrl,
        boolean    available,

        // Populated only when a warehouseId is provided to the catalog endpoint.
        Integer    qtyAvailable,
        Boolean    inStock
) {}
