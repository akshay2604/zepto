package com.zepto.dto;

import java.util.UUID;

public record TopVariantDto(
        UUID   variantId,
        String displayName,
        String sku,
        long   totalQtySold
) {}
