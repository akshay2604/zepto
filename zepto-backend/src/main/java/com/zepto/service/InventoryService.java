package com.zepto.service;

import com.zepto.dto.InventoryEventDto;
import com.zepto.dto.request.InitLedgerRequest;
import com.zepto.dto.request.StockMovementRequest;
import com.zepto.dto.request.UpdateThresholdRequest;
import com.zepto.dto.response.InventoryLedgerResponse;
import com.zepto.dto.response.StockMovementResponse;
import com.zepto.entity.InventoryLedger;
import com.zepto.entity.StockMovement;
import com.zepto.entity.Warehouse;
import com.zepto.entity.ProductVariant;
import com.zepto.entity.enums.MovementType;
import com.zepto.repository.InventoryLedgerRepository;
import com.zepto.repository.StockMovementRepository;
import com.zepto.repository.WarehouseRepository;
import com.zepto.repository.ProductVariantRepository;
import com.zepto.sse.SseEmitterService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryService {

    private static final Set<MovementType> EXTERNAL_TYPES =
            Set.of(MovementType.INBOUND, MovementType.SPOILAGE, MovementType.ADJUSTMENT);

    private final WarehouseRepository       warehouseRepository;
    private final ProductVariantRepository  variantRepository;
    private final InventoryLedgerRepository ledgerRepository;
    private final StockMovementRepository   stockMovementRepository;
    private final SseEmitterService         sseEmitterService;

    public StockMovementResponse applyMovement(StockMovementRequest req) {
        if (!EXTERNAL_TYPES.contains(req.movementType())) {
            throw new IllegalArgumentException(
                    "Movement type " + req.movementType() + " is managed internally and cannot be submitted via API");
        }
        if (req.qtyDelta() == 0) {
            throw new IllegalArgumentException("qtyDelta must be non-zero");
        }

        Warehouse warehouse = warehouseRepository.findById(req.warehouseId())
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()));

        ProductVariant variant = variantRepository.findById(req.variantId())
                .orElseThrow(() -> new EntityNotFoundException("Variant not found: " + req.variantId()));

        InventoryLedger ledger = ledgerRepository
                .findByWarehouseIdAndVariantIdWithLock(warehouse.getId(), variant.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "No inventory record for SKU " + variant.getSkuCode() + " in this warehouse"));

        int newQtyOnHand = ledger.getQtyOnHand() + req.qtyDelta();
        if (newQtyOnHand < 0) {
            throw new IllegalStateException(
                    "Movement would result in negative stock: current=" + ledger.getQtyOnHand()
                    + ", delta=" + req.qtyDelta());
        }

        ledger.setQtyOnHand(newQtyOnHand);
        ledger.setLastUpdated(LocalDateTime.now());
        ledgerRepository.save(ledger);

        StockMovement movement = stockMovementRepository.save(StockMovement.builder()
                .warehouse(warehouse)
                .variant(variant)
                .movementType(req.movementType())
                .qtyDelta(req.qtyDelta())
                .referenceId(req.referenceId())
                .build());

        sseEmitterService.publish("inventory", "inventory-update", new InventoryEventDto(
                variant.getId(), variant.getSkuCode(), variant.getDisplayName(),
                req.movementType(), req.qtyDelta(),
                ledger.getQtyOnHand(), ledger.getQtyAvailable(),
                warehouse.getId(), warehouse.getName(),
                movement.getCreatedAt()
        ));

        log.info("[INVENTORY] {} {} | {} | delta={} | onHand={}",
                req.movementType(), variant.getSkuCode(), warehouse.getName(),
                req.qtyDelta(), ledger.getQtyOnHand());

        return new StockMovementResponse(
                movement.getId(),
                warehouse.getId(), warehouse.getName(),
                variant.getId(), variant.getDisplayName(), variant.getSkuCode(),
                movement.getMovementType(), movement.getQtyDelta(),
                ledger.getQtyOnHand(), ledger.getQtyAvailable(),
                movement.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<InventoryLedgerResponse> getLedgers(UUID warehouseId) {
        List<InventoryLedger> ledgers = warehouseId != null
                ? ledgerRepository.findByWarehouseId(warehouseId)
                : ledgerRepository.findAll();
        return ledgers.stream().map(InventoryService::toLedgerResponse).toList();
    }

    public InventoryLedgerResponse initLedger(InitLedgerRequest req) {
        Warehouse warehouse = warehouseRepository.findById(req.warehouseId())
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()));
        ProductVariant variant = variantRepository.findById(req.variantId())
                .orElseThrow(() -> new EntityNotFoundException("Variant not found: " + req.variantId()));

        if (ledgerRepository.findByWarehouseIdAndVariantId(req.warehouseId(), req.variantId()).isPresent()) {
            throw new IllegalStateException("Ledger already exists for this warehouse+variant combination");
        }

        InventoryLedger ledger = ledgerRepository.save(InventoryLedger.builder()
                .warehouse(warehouse)
                .variant(variant)
                .qtyOnHand(req.initialQty())
                .qtyReserved(0)
                .reorderThreshold(req.reorderThreshold())
                .build());

        return toLedgerResponse(ledger);
    }

    public InventoryLedgerResponse updateThreshold(UUID warehouseId, UUID variantId, UpdateThresholdRequest req) {
        InventoryLedger ledger = ledgerRepository
                .findByWarehouseIdAndVariantIdWithLock(warehouseId, variantId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No ledger for warehouse=" + warehouseId + " variant=" + variantId));
        ledger.setReorderThreshold(req.reorderThreshold());
        return toLedgerResponse(ledgerRepository.save(ledger));
    }

    @Transactional(readOnly = true)
    public InventoryLedgerResponse getLedger(UUID warehouseId, UUID variantId) {
        return ledgerRepository.findByWarehouseIdAndVariantId(warehouseId, variantId)
                .map(InventoryService::toLedgerResponse)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "No inventory record for warehouse=" + warehouseId + " variant=" + variantId));
    }

    static InventoryLedgerResponse toLedgerResponse(InventoryLedger l) {
        return new InventoryLedgerResponse(
                l.getId(),
                l.getWarehouse().getId(), l.getWarehouse().getName(),
                l.getVariant().getId(), l.getVariant().getDisplayName(), l.getVariant().getSkuCode(),
                l.getQtyOnHand(), l.getQtyReserved(), l.getQtyAvailable(),
                l.getReorderThreshold(),
                l.getQtyOnHand() <= l.getReorderThreshold()
        );
    }
}
