package com.zepto.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record WarehouseResponse(
        UUID       id,
        String     name,
        String     address,
        String     city,
        String     pincode,
        BigDecimal lat,
        BigDecimal lng,
        boolean    active
) {}
