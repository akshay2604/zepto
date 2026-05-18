package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateRiderRequest(
        @NotBlank String name,
                  String phone,
                  String vehicleNumber,
                  UUID   warehouseId
) {}
