package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateProductRequest(

        @NotBlank @Size(max = 200) String name,
        @Size(max = 100)           String brand,
        String                     description,
        @NotNull                   UUID   categoryId
) {}
