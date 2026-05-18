package com.zepto.dto.response;

import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID                  id,
        String                name,
        String                brand,
        String                description,
        UUID                  categoryId,
        String                categoryName,
        boolean               active,
        List<VariantResponse> variants
) {}
