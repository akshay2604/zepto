package com.zepto.dto.response;

import com.zepto.entity.Picker;

import java.util.UUID;

public record PickerResponse(
        UUID    id,
        String  name,
        String  phone,
        boolean active
) {
    public static PickerResponse from(Picker p) {
        return new PickerResponse(p.getId(), p.getName(), p.getPhone(), p.isActive());
    }
}
