package com.zepto.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record DeliveryResponse(
        UUID          id,
        UUID          orderId,
        String        riderName,
        String        riderPhone,
        String        status,
        LocalDateTime assignedAt,
        LocalDateTime pickedUpAt,
        LocalDateTime deliveredAt,
        Integer       deliveryTimeSecs
) {}
