package com.zepto.service;

import com.zepto.entity.Category;
import com.zepto.entity.enums.ZoneType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CategoryZoneResolver {

    /** Resolve zone from a Category entity — uses stored zoneType, falls back to keyword inference. */
    public ZoneType resolve(Category category) {
        if (category != null && category.getZoneType() != null) {
            return category.getZoneType();
        }
        return inferFromName(category != null ? category.getName() : null);
    }

    /** Kept for legacy callers that only have a name string (e.g. ZoneService). */
    public ZoneType resolve(String categoryName) {
        return inferFromName(categoryName);
    }

    private static final List<String> FROZEN_KEYWORDS  = List.of("frozen", "ice cream", "freeze");
    private static final List<String> CHILLED_KEYWORDS = List.of("dairy", "milk", "curd", "yogurt", "cheese", "butter", "eggs", "chilled", "cold");
    private static final List<String> PRODUCE_KEYWORDS = List.of("fruits", "vegetables", "produce", "fresh");

    private ZoneType inferFromName(String name) {
        if (name == null) return ZoneType.AMBIENT;
        String lower = name.toLowerCase();
        if (FROZEN_KEYWORDS.stream().anyMatch(lower::contains))  return ZoneType.FROZEN;
        if (CHILLED_KEYWORDS.stream().anyMatch(lower::contains)) return ZoneType.CHILLED;
        if (PRODUCE_KEYWORDS.stream().anyMatch(lower::contains)) return ZoneType.PRODUCE;
        return ZoneType.AMBIENT;
    }
}
