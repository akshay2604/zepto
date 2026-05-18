package com.zepto.dto.response;

import java.util.UUID;

public record PurgeWarehouseResponse(
        UUID   warehouseId,
        String warehouseName,
        int    ordersDeleted,
        int    batchesDeleted,
        int    pickersDeleted,
        int    ridersDeleted,
        int    customersUnassigned,
        int    inventoryLedgersDeleted
) {}
