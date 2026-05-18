package com.zepto.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record AddressResponse(
        UUID       id,
        String     label,
        String     line1,
        String     line2,
        String     pincode,
        String     city,
        BigDecimal lat,
        BigDecimal lng,
        boolean    isDefault
) {}
