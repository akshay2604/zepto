package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateVariantRequest(

        @NotBlank @Size(max = 100) String     skuCode,
        @NotBlank @Size(max = 200) String     displayName,
        @Size(max = 50)            String     packSize,
        @Size(max = 20)            String     unit,
        @NotNull  @Positive        BigDecimal mrp,
        @NotNull  @Positive        BigDecimal sellingPrice,
        String                     imageUrl
) {}
