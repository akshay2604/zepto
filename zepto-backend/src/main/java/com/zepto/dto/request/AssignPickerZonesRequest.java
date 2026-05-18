package com.zepto.dto.request;

import com.zepto.entity.enums.ZoneType;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record AssignPickerZonesRequest(@NotNull Set<ZoneType> zones) {}
