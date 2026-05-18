package com.zepto.dto.response;

import java.util.List;

public record OnboardWarehouseResponse(
        WarehouseResponse      warehouse,
        List<PickerResponse>   pickers,
        List<RiderResponse>    riders,
        List<UserResponse>     customers,
        int                    inventoryVariantsSeeded
) {}
