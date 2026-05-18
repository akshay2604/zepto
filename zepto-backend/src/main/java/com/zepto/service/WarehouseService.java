package com.zepto.service;

import com.zepto.dto.request.CreateWarehouseRequest;
import com.zepto.dto.request.UpdateWarehouseRequest;
import com.zepto.dto.response.InventoryLedgerResponse;
import com.zepto.dto.response.WarehouseResponse;
import com.zepto.entity.InventoryLedger;
import com.zepto.entity.ProductVariant;
import com.zepto.entity.Warehouse;
import com.zepto.repository.InventoryLedgerRepository;
import com.zepto.repository.ProductVariantRepository;
import com.zepto.repository.WarehouseRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WarehouseService {

    private final WarehouseRepository       warehouseRepository;
    private final ProductVariantRepository  variantRepository;
    private final InventoryLedgerRepository ledgerRepository;

    @Transactional(readOnly = true)
    public List<WarehouseResponse> listWarehouses() {
        return warehouseRepository.findAll().stream().map(WarehouseService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouse(UUID id) {
        return toResponse(find(id));
    }

    public WarehouseResponse create(CreateWarehouseRequest req) {
        Warehouse warehouse = warehouseRepository.save(Warehouse.builder()
                .name(req.name())
                .address(req.address())
                .city(req.city())
                .pincode(req.pincode())
                .lat(req.lat())
                .lng(req.lng())
                .active(true)
                .build());

        // Bootstrap ledger entries for every existing active variant (qty=0)
        List<ProductVariant> variants = variantRepository.findByAvailableTrue();
        for (ProductVariant v : variants) {
            ledgerRepository.save(InventoryLedger.builder()
                    .warehouse(warehouse)
                    .variant(v)
                    .qtyOnHand(0)
                    .qtyReserved(0)
                    .reorderThreshold(20)
                    .build());
        }

        log.info("[WAREHOUSE] Created {} with {} ledger entries", warehouse.getName(), variants.size());
        return toResponse(warehouse);
    }

    public WarehouseResponse update(UUID id, UpdateWarehouseRequest req) {
        Warehouse warehouse = find(id);
        if (req.name()    != null) warehouse.setName(req.name());
        if (req.address() != null) warehouse.setAddress(req.address());
        if (req.city()    != null) warehouse.setCity(req.city());
        if (req.pincode() != null) warehouse.setPincode(req.pincode());
        if (req.lat()     != null) warehouse.setLat(req.lat());
        if (req.lng()     != null) warehouse.setLng(req.lng());
        if (req.active()  != null) warehouse.setActive(req.active());
        return toResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse deactivate(UUID id) {
        Warehouse warehouse = find(id);
        warehouse.setActive(false);
        return toResponse(warehouseRepository.save(warehouse));
    }

    private Warehouse find(UUID id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + id));
    }

    static WarehouseResponse toResponse(Warehouse w) {
        return new WarehouseResponse(
                w.getId(), w.getName(), w.getAddress(), w.getCity(),
                w.getPincode(), w.getLat(), w.getLng(), w.getActive()
        );
    }
}
