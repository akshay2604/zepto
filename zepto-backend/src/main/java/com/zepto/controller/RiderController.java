package com.zepto.controller;

import com.zepto.dto.request.AssignWarehouseRequest;
import com.zepto.dto.request.CreateRiderRequest;
import com.zepto.dto.request.UpdateRiderRequest;
import com.zepto.dto.response.RiderResponse;
import com.zepto.entity.Rider;
import com.zepto.entity.Warehouse;
import com.zepto.repository.RiderRepository;
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
@RequestMapping("/riders")
@RequiredArgsConstructor
public class RiderController {

    private final RiderRepository     riderRepository;
    private final WarehouseRepository warehouseRepository;

    @GetMapping
    public List<RiderResponse> list(
            @RequestParam(required = false) UUID    warehouseId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {

        if (warehouseId != null) {
            return riderRepository.findByWarehouseIdAndActiveTrueOrderByNameAsc(warehouseId)
                    .stream().map(RiderResponse::from).toList();
        }
        List<Rider> riders = includeInactive
                ? riderRepository.findAllByOrderByNameAsc()
                : riderRepository.findByActiveTrueOrderByNameAsc();
        return riders.stream().map(RiderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public RiderResponse get(@PathVariable UUID id) {
        return RiderResponse.from(find(id));
    }

    @PostMapping
    public ResponseEntity<RiderResponse> create(@Valid @RequestBody CreateRiderRequest req) {
        Warehouse warehouse = req.warehouseId() != null
                ? warehouseRepository.findById(req.warehouseId())
                        .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()))
                : null;

        Rider rider = riderRepository.save(Rider.builder()
                .name(req.name())
                .phone(req.phone())
                .vehicleNumber(req.vehicleNumber())
                .warehouse(warehouse)
                .active(true)
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(RiderResponse.from(rider));
    }

    @PutMapping("/{id}")
    public RiderResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateRiderRequest req) {
        Rider rider = find(id);
        rider.setName(req.name());
        rider.setPhone(req.phone());
        rider.setVehicleNumber(req.vehicleNumber());
        return RiderResponse.from(riderRepository.save(rider));
    }

    @PostMapping("/{id}/assign-warehouse")
    public RiderResponse assignWarehouse(@PathVariable UUID id, @Valid @RequestBody AssignWarehouseRequest req) {
        Rider rider = find(id);
        Warehouse warehouse = warehouseRepository.findById(req.warehouseId())
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()));
        rider.setWarehouse(warehouse);
        return RiderResponse.from(riderRepository.save(rider));
    }

    @PostMapping("/{id}/unassign-warehouse")
    public RiderResponse unassignWarehouse(@PathVariable UUID id) {
        Rider rider = find(id);
        rider.setWarehouse(null);
        return RiderResponse.from(riderRepository.save(rider));
    }

    @PatchMapping("/{id}/activate")
    public RiderResponse activate(@PathVariable UUID id) {
        Rider rider = find(id);
        rider.setActive(true);
        return RiderResponse.from(riderRepository.save(rider));
    }

    @PatchMapping("/{id}/deactivate")
    public RiderResponse deactivate(@PathVariable UUID id) {
        Rider rider = find(id);
        rider.setActive(false);
        return RiderResponse.from(riderRepository.save(rider));
    }

    private Rider find(UUID id) {
        return riderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rider not found: " + id));
    }
}
