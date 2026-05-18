package com.zepto.dto.response;

import com.zepto.entity.Zone;
import com.zepto.entity.enums.ZoneType;

import java.util.UUID;

public record ZoneResponse(
        UUID     id,
        UUID     warehouseId,
        String   name,
        ZoneType zoneType,
        int      displayOrder,
        double   x,
        double   y,
        double   w,
        double   h,
        int      orderCount
) {
    public static ZoneResponse from(Zone z, int orderCount) {
        return new ZoneResponse(
                z.getId(), z.getWarehouse().getId(), z.getName(),
                z.getZoneType(), z.getDisplayOrder(),
                z.getX(), z.getY(), z.getW(), z.getH(),
                orderCount
        );
    }
}
