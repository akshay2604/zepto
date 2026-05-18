package com.zepto.dto.request;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateWarehouseRequest(
        @Size(max = 200) String name,
        String     address,
        @Size(max = 100) String city,
        @Size(max = 10)  String pincode,
        BigDecimal lat,
        BigDecimal lng,
        Boolean    active
) {}
