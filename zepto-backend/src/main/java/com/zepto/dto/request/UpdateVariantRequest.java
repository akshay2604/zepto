package com.zepto.dto.request;

import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record UpdateVariantRequest(
        @Positive BigDecimal mrp,
        @Positive BigDecimal sellingPrice,
        Boolean              available,
        String               imageUrl
) {}
