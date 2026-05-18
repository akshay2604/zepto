package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateRiderRequest(
        @NotBlank String name,
                  String phone,
                  String vehicleNumber
) {}
