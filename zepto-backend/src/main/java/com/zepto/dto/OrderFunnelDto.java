package com.zepto.dto;

import java.util.Map;

public record OrderFunnelDto(Map<String, Long> countByStatus) {}
