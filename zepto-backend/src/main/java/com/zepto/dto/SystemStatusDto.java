package com.zepto.dto;

/** System-wide status snapshot published as an SSE heartbeat to the admin stream. */
public record SystemStatusDto(
        boolean paused,
        long    totalOrders,
        long    totalDelivered,
        long    totalMovements,
        long    activeEmitters
) {}
