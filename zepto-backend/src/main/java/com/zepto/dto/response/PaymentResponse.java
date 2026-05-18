package com.zepto.dto.response;

import com.zepto.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID          id,
        UUID          orderId,
        String        method,
        PaymentStatus status,
        BigDecimal    amount,
        String        gatewayTxnId,
        LocalDateTime paidAt
) {}
