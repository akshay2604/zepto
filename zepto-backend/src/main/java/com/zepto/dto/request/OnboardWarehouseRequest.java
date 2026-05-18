package com.zepto.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record OnboardWarehouseRequest(
        @NotBlank String name,
        @NotBlank String address,
        @NotBlank String city,
        @NotBlank String pincode,
        @NotNull  BigDecimal lat,
        @NotNull  BigDecimal lng,
        @Min(1) @Max(20) int riderCount,
        @Min(1) @Max(10) int pickerCount,
        @Min(1) @Max(50) int customerCount
) {
    public OnboardWarehouseRequest {
        if (riderCount   <= 0) riderCount   = 5;
        if (pickerCount  <= 0) pickerCount  = 3;
        if (customerCount<= 0) customerCount = 10;
    }
}
