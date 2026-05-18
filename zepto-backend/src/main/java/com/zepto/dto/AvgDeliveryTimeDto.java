package com.zepto.dto;

public record AvgDeliveryTimeDto(
        double avgDeliveryTimeSecs,
        long   totalDelivered
) {}
