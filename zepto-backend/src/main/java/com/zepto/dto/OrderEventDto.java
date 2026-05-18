package com.zepto.dto;

import com.zepto.entity.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Pushed to the /stream/orders SSE channel after every order state change. */
public record OrderEventDto(
        UUID        orderId,
        String      userName,
        OrderStatus status,
        BigDecimal  amountPayable,
        int         itemCount,
        UUID        warehouseId,
        String      warehouseName,
        String      pickerName,
        LocalDateTime timestamp
) {}
