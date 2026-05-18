package com.zepto.dto.response;

import java.util.UUID;

public record CategoryResponse(
        UUID   id,
        String name,
        UUID   parentId
) {}
