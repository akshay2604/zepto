package com.zepto.dto.response;

import com.zepto.entity.Picker;
import com.zepto.entity.PickerZone;
import com.zepto.entity.enums.ZoneType;

import java.util.List;
import java.util.UUID;

public record PickerResponse(
        UUID           id,
        String         name,
        String         phone,
        boolean        active,
        List<ZoneType> zones
) {
    public static PickerResponse from(Picker p, List<PickerZone> pickerZones) {
        List<ZoneType> zones = pickerZones.stream()
                .map(PickerZone::getZoneType)
                .sorted()
                .toList();
        return new PickerResponse(p.getId(), p.getName(), p.getPhone(), p.isActive(), zones);
    }

    public static PickerResponse from(Picker p) {
        return new PickerResponse(p.getId(), p.getName(), p.getPhone(), p.isActive(), List.of());
    }
}
