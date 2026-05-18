package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AddAddressRequest(

        @Size(max = 50)
        String label,

        @NotBlank @Size(max = 300)
        String line1,

        @Size(max = 300)
        String line2,

        @Size(max = 10)
        String pincode,

        @Size(max = 100)
        String city,

        BigDecimal lat,
        BigDecimal lng,
        boolean isDefault
) {}
