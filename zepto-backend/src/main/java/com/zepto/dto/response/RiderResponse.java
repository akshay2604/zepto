package com.zepto.dto.response;

import com.zepto.entity.Rider;

import java.util.UUID;

public record RiderResponse(
        UUID    id,
        String  name,
        String  phone,
        String  vehicleNumber,
        boolean active,
        UUID    warehouseId,
        String  warehouseName
) {
    public static RiderResponse from(Rider r) {
        return new RiderResponse(
                r.getId(),
                r.getName(),
                r.getPhone(),
                r.getVehicleNumber(),
                r.isActive(),
                r.getWarehouse() != null ? r.getWarehouse().getId()   : null,
                r.getWarehouse() != null ? r.getWarehouse().getName() : null
        );
    }
}
