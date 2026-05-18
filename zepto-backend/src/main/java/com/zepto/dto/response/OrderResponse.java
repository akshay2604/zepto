package com.zepto.dto.response;

import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID            id,
        OrderStatus     status,
        UserSummary     user,
        WarehouseSummary warehouse,
        AddressResponse address,
        List<ItemLine>  items,
        BigDecimal      totalMrp,
        BigDecimal      totalDiscount,
        BigDecimal      deliveryFee,
        BigDecimal      amountPayable,
        String          paymentMethod,
        PaymentStatus   paymentStatus,
        LocalDateTime   placedAt
) {
    public record UserSummary(UUID id, String name, String phone) {}
    public record WarehouseSummary(UUID id, String name, String city) {}
    public record ItemLine(
            UUID variantId, String displayName, String sku,
            String categoryName,
            int qty, BigDecimal unitPrice, BigDecimal lineTotal
    ) {}
}
