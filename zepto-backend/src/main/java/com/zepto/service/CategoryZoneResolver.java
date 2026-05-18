package com.zepto.service;

import com.zepto.entity.enums.ZoneType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CategoryZoneResolver {

    private static final List<String> FROZEN_KEYWORDS  = List.of("frozen", "ice cream", "freeze");
    private static final List<String> CHILLED_KEYWORDS = List.of("dairy", "milk", "curd", "yogurt", "cheese", "butter", "eggs", "chilled", "cold");
    private static final List<String> PRODUCE_KEYWORDS = List.of("fruits", "vegetables", "produce", "fresh");

    public ZoneType resolve(String categoryName) {
        if (categoryName == null) return ZoneType.AMBIENT;
        String lower = categoryName.toLowerCase();
        if (FROZEN_KEYWORDS.stream().anyMatch(lower::contains))  return ZoneType.FROZEN;
        if (CHILLED_KEYWORDS.stream().anyMatch(lower::contains)) return ZoneType.CHILLED;
        if (PRODUCE_KEYWORDS.stream().anyMatch(lower::contains)) return ZoneType.PRODUCE;
        return ZoneType.AMBIENT;
    }
}
