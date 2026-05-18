package com.zepto.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID          id,
        String        name,
        String        phone,
        String        email,
        LocalDateTime createdAt,
        boolean       active,
        UUID          warehouseId,
        String        warehouseName
) {}
