package com.zepto.controller;

import com.zepto.dto.request.CreatePickerRequest;
import com.zepto.dto.response.PickerResponse;
import com.zepto.entity.Picker;
import com.zepto.entity.Warehouse;
import com.zepto.repository.PickerRepository;
import com.zepto.repository.WarehouseRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pickers")
@RequiredArgsConstructor
public class PickerController {

    private final PickerRepository    pickerRepository;
    private final WarehouseRepository warehouseRepository;

    @GetMapping
    public ResponseEntity<List<PickerResponse>> listPickers(
            @RequestParam UUID warehouseId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        List<Picker> result = includeInactive
                ? pickerRepository.findByWarehouseId(warehouseId)
                : pickerRepository.findByWarehouseIdAndActiveTrue(warehouseId);
        return ResponseEntity.ok(result.stream().map(PickerResponse::from).toList());
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
        Picker picker = pickerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Picker not found: " + id));
        picker.setActive(false);
        return ResponseEntity.ok(PickerResponse.from(pickerRepository.save(picker)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<PickerResponse> activate(@PathVariable UUID id) {
        Picker picker = pickerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Picker not found: " + id));
        picker.setActive(true);
        return ResponseEntity.ok(PickerResponse.from(pickerRepository.save(picker)));
    }
}
