package com.zepto.controller;

import com.zepto.dto.request.AssignPickerZonesRequest;
import com.zepto.dto.request.CreatePickerRequest;
import com.zepto.dto.response.PickerResponse;
import com.zepto.entity.Picker;
import com.zepto.entity.PickerZone;
import com.zepto.entity.Warehouse;
import com.zepto.entity.enums.ZoneType;
import com.zepto.repository.PickerRepository;
import com.zepto.repository.PickerZoneRepository;
import com.zepto.repository.WarehouseRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/pickers")
@RequiredArgsConstructor
public class PickerController {

    private final PickerRepository     pickerRepository;
    private final PickerZoneRepository pickerZoneRepository;
    private final WarehouseRepository  warehouseRepository;

    @GetMapping
    public ResponseEntity<List<PickerResponse>> listPickers(
            @RequestParam UUID warehouseId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        List<Picker> pickers = includeInactive
                ? pickerRepository.findByWarehouseId(warehouseId)
                : pickerRepository.findByWarehouseIdAndActiveTrue(warehouseId);
        return ResponseEntity.ok(pickers.stream()
                .map(p -> PickerResponse.from(p, pickerZoneRepository.findByPickerId(p.getId())))
                .toList());
    }

    @PostMapping
    public ResponseEntity<PickerResponse> createPicker(@Valid @RequestBody CreatePickerRequest req) {
        Warehouse warehouse = warehouseRepository.findById(req.warehouseId())
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()));
        Picker picker = pickerRepository.save(Picker.builder()
                .warehouse(warehouse)
                .name(req.name())
                .phone(req.phone())
                .active(true)
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(PickerResponse.from(picker));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<PickerResponse> deactivate(@PathVariable UUID id) {
        Picker picker = find(id);
        picker.setActive(false);
        return ResponseEntity.ok(PickerResponse.from(pickerRepository.save(picker),
                pickerZoneRepository.findByPickerId(id)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<PickerResponse> activate(@PathVariable UUID id) {
        Picker picker = find(id);
        picker.setActive(true);
        return ResponseEntity.ok(PickerResponse.from(pickerRepository.save(picker),
                pickerZoneRepository.findByPickerId(id)));
    }

    /** Replace all zone assignments for a picker in one call. */
    @Transactional
    @PutMapping("/{id}/zones")
    public ResponseEntity<PickerResponse> setZones(
            @PathVariable UUID id,
            @Valid @RequestBody AssignPickerZonesRequest req) {
        Picker picker = find(id);
        pickerZoneRepository.deleteByPickerId(id);
        List<PickerZone> saved = req.zones().stream()
                .map(z -> pickerZoneRepository.save(PickerZone.builder().picker(picker).zoneType(z).build()))
                .toList();
        return ResponseEntity.ok(PickerResponse.from(picker, saved));
    }

    /** Returns pickers whose zone set covers ALL zones in the given batch requirement. */
    @GetMapping("/eligible")
    public ResponseEntity<List<PickerResponse>> eligibleForZones(
            @RequestParam UUID warehouseId,
            @RequestParam Set<ZoneType> zones) {
        Set<ZoneType> required = zones.isEmpty() ? EnumSet.noneOf(ZoneType.class) : EnumSet.copyOf(zones);
        Set<UUID> eligible = required.isEmpty()
                ? null
                : pickerZoneRepository.findPickerIdsCoveringAllZones(warehouseId, required, required.size());

        List<Picker> pickers = pickerRepository.findByWarehouseIdAndActiveTrue(warehouseId);
        List<PickerResponse> result = pickers.stream()
                .filter(p -> eligible == null || eligible.contains(p.getId()))
                .map(p -> PickerResponse.from(p, pickerZoneRepository.findByPickerId(p.getId())))
                .toList();
        return ResponseEntity.ok(result);
    }

    private Picker find(UUID id) {
        return pickerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Picker not found: " + id));
    }
}
