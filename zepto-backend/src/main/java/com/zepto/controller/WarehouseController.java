package com.zepto.controller;

import com.zepto.dto.request.CreateWarehouseRequest;
import com.zepto.dto.request.OnboardWarehouseRequest;
import com.zepto.dto.request.UpdateWarehouseRequest;
import com.zepto.dto.response.OnboardWarehouseResponse;
import com.zepto.dto.response.PurgeWarehouseResponse;
import com.zepto.dto.response.WarehouseResponse;
import com.zepto.service.DarkStoreService;
import com.zepto.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final DarkStoreService darkStoreService;

    @GetMapping
    public ResponseEntity<List<WarehouseResponse>> list() {
        return ResponseEntity.ok(warehouseService.listWarehouses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(warehouseService.getWarehouse(id));
    }

    @PostMapping
    public ResponseEntity<WarehouseResponse> create(@Valid @RequestBody CreateWarehouseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.create(req));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WarehouseResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseRequest req) {
        return ResponseEntity.ok(warehouseService.update(id, req));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<WarehouseResponse> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(warehouseService.deactivate(id));
    }

    @PostMapping("/onboard")
    public ResponseEntity<OnboardWarehouseResponse> onboard(@Valid @RequestBody OnboardWarehouseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(darkStoreService.onboard(req));
    }

    @DeleteMapping("/{id}/purge")
    public ResponseEntity<PurgeWarehouseResponse> purge(@PathVariable UUID id) {
        return ResponseEntity.ok(darkStoreService.purge(id));
    }
}
