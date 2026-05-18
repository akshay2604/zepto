package com.zepto.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InitLedgerRequest(

        @NotNull UUID warehouseId,
        @NotNull UUID variantId,

        @Min(0) int initialQty,
        @Min(1) int reorderThreshold
) {}
