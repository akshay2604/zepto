package com.zepto.controller;

import com.zepto.dto.request.InitLedgerRequest;
import com.zepto.dto.request.StockMovementRequest;
import com.zepto.dto.request.UpdateThresholdRequest;
import com.zepto.dto.response.InventoryLedgerResponse;
import com.zepto.dto.response.StockMovementResponse;
import com.zepto.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    // ── Ledger reads ──────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<InventoryLedgerResponse>> getLedgers(
            @RequestParam(required = false) UUID warehouseId) {
        return ResponseEntity.ok(inventoryService.getLedgers(warehouseId));
    }

    @GetMapping("/{warehouseId}/{variantId}")
    public ResponseEntity<InventoryLedgerResponse> getLedger(
            @PathVariable UUID warehouseId,
            @PathVariable UUID variantId) {
        return ResponseEntity.ok(inventoryService.getLedger(warehouseId, variantId));
    }

    // ── Ledger management ─────────────────────────────────────────────────────

    @PostMapping("/ledger")
    public ResponseEntity<InventoryLedgerResponse> initLedger(
            @Valid @RequestBody InitLedgerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.initLedger(req));
    }

    @PatchMapping("/{warehouseId}/{variantId}/threshold")
    public ResponseEntity<InventoryLedgerResponse> updateThreshold(
            @PathVariable UUID warehouseId,
            @PathVariable UUID variantId,
            @Valid @RequestBody UpdateThresholdRequest req) {
        return ResponseEntity.ok(inventoryService.updateThreshold(warehouseId, variantId, req));
    }

    // ── Stock movements ───────────────────────────────────────────────────────

    @PostMapping("/movements")
    public ResponseEntity<StockMovementResponse> applyMovement(
            @Valid @RequestBody StockMovementRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.applyMovement(req));
    }
}
