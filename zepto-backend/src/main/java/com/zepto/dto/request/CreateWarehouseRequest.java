package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateWarehouseRequest(

        @NotBlank @Size(max = 200) String name,
        @NotBlank                  String address,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 10)  String pincode,
        BigDecimal lat,
        BigDecimal lng
) {}
