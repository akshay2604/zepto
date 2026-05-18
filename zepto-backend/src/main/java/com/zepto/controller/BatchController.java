package com.zepto.controller;

import com.zepto.dto.request.AssignPickerToBatchRequest;
import com.zepto.dto.response.PickBatchItemResponse;
import com.zepto.dto.response.PickBatchResponse;
import com.zepto.entity.enums.BatchStatus;
import com.zepto.service.BatchingService;
import com.zepto.service.PickBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchingService  batchingService;
    private final PickBatchService pickBatchService;

    @PostMapping("/form")
    public ResponseEntity<List<PickBatchResponse>> formBatches(@RequestParam UUID warehouseId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(batchingService.formBatches(warehouseId));
    }

    @GetMapping
    public ResponseEntity<List<PickBatchResponse>> listBatches(
            @RequestParam UUID warehouseId,
            @RequestParam(required = false) BatchStatus status) {
        return ResponseEntity.ok(pickBatchService.listBatches(warehouseId, Optional.ofNullable(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PickBatchResponse> getBatch(@PathVariable UUID id) {
        return ResponseEntity.ok(pickBatchService.getBatch(id));
    }

    @PostMapping("/{id}/assign-picker")
    public ResponseEntity<PickBatchResponse> assignPicker(
            @PathVariable UUID id,
            @Valid @RequestBody AssignPickerToBatchRequest req) {
        return ResponseEntity.ok(pickBatchService.assignPicker(id, req.pickerId()));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<PickBatchResponse> startBatch(@PathVariable UUID id) {
        return ResponseEntity.ok(pickBatchService.startBatch(id));
    }

    @PostMapping("/{id}/items/{itemId}/pick")
    public ResponseEntity<PickBatchItemResponse> pickItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId) {
        return ResponseEntity.ok(pickBatchService.pickItem(id, itemId));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<PickBatchResponse> completeBatch(@PathVariable UUID id) {
        return ResponseEntity.ok(pickBatchService.completeBatch(id));
    }
}
