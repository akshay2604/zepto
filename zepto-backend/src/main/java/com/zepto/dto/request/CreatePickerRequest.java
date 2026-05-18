package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreatePickerRequest(
        @NotNull  UUID   warehouseId,
        @NotBlank String name,
                  String phone
) {}
