package com.zepto.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MovementAuditDto(
        UUID          id,
        String        variantName,
        String        sku,
        String        movementType,
        int           qtyDelta,
        LocalDateTime createdAt
) {}
