package com.zepto.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignWarehouseRequest(
        @NotNull UUID warehouseId
) {}
