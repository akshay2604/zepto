package com.zepto.dto.request;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateProductRequest(
        @Size(max = 200) String  name,
        @Size(max = 100) String  brand,
        String                   description,
        UUID                     categoryId,
        Boolean                  active
) {}
