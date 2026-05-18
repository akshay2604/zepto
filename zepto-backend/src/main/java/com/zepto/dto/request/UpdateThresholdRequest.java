package com.zepto.dto.request;

import jakarta.validation.constraints.Min;

public record UpdateThresholdRequest(
        @Min(1) int reorderThreshold
) {}
