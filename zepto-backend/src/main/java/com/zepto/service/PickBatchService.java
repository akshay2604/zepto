package com.zepto.service;

import com.zepto.dto.response.PickBatchItemResponse;
import com.zepto.dto.response.PickBatchResponse;
import com.zepto.entity.*;
import com.zepto.entity.enums.BatchStatus;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.ZoneType;
import com.zepto.repository.*;

import java.util.Set;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PickBatchService {

    private final PickBatchRepository      pickBatchRepository;
    private final PickBatchItemRepository  pickBatchItemRepository;
    private final PickerRepository         pickerRepository;
    private final PickerZoneRepository     pickerZoneRepository;
    private final OrderLifecycleService    orderLifecycleService;

    @Transactional(readOnly = true)
    public List<PickBatchResponse> listBatches(UUID warehouseId, Optional<BatchStatus> status) {
        List<PickBatch> batches = status
                .map(s -> pickBatchRepository.findByWarehouseIdAndStatusOrderByCreatedAtDesc(warehouseId, s))
                .orElseGet(() -> pickBatchRepository.findByWarehouseIdOrderByCreatedAtDesc(warehouseId));
        return batches.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PickBatchResponse getBatch(UUID batchId) {
        return toResponse(findBatch(batchId));
    }

    public PickBatchResponse assignPicker(UUID batchId, UUID pickerId) {
        PickBatch batch = findBatch(batchId);
        Picker picker = pickerRepository.findById(pickerId)
                .orElseThrow(() -> new EntityNotFoundException("Picker not found: " + pickerId));

        // Validate zone coverage — picker must cover every zone this batch touches
        Set<ZoneType> batchZones = pickBatchItemRepository
                .findByBatchIdOrderBySortOrderAsc(batchId).stream()
                .map(PickBatchItem::getZoneType)
                .collect(java.util.stream.Collectors.toCollection(() -> java.util.EnumSet.noneOf(ZoneType.class)));

        if (!batchZones.isEmpty()) {
            Set<ZoneType> pickerZones = pickerZoneRepository.findByPickerId(pickerId).stream()
                    .map(com.zepto.entity.PickerZone::getZoneType)
                    .collect(java.util.stream.Collectors.toSet());
            if (!pickerZones.containsAll(batchZones)) {
                Set<ZoneType> missing = new java.util.HashSet<>(batchZones);
                missing.removeAll(pickerZones);
                throw new IllegalStateException(
                        "Picker " + picker.getName() + " is not assigned to zones: " + missing
                        + ". Assign them to these zones first.");
            }
        }

        batch.setPicker(picker);
        return toResponse(pickBatchRepository.save(batch));
    }

    public PickBatchResponse startBatch(UUID batchId) {
        PickBatch batch = findBatch(batchId);
        requireStatus(batch, BatchStatus.PENDING);
        batch.setStatus(BatchStatus.ACTIVE);

        // Transition each order CONFIRMED → PICKING
        batch.getBatchOrders().forEach(bo -> {
            Order order = bo.getOrder();
            if (order.getStatus() == OrderStatus.CONFIRMED) {
                if (batch.getPicker() != null) {
                    orderLifecycleService.assignPicker(order.getId(), batch.getPicker().getId());
                } else {
                    orderLifecycleService.startPicking(order.getId());
                }
            }
        });

        return toResponse(pickBatchRepository.save(batch));
    }

    public PickBatchItemResponse pickItem(UUID batchId, UUID itemId) {
        PickBatch batch = findBatch(batchId);
        requireStatus(batch, BatchStatus.ACTIVE);
        PickBatchItem item = pickBatchItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Batch item not found: " + itemId));
        if (!item.getBatch().getId().equals(batchId)) {
            throw new IllegalArgumentException("Item does not belong to batch " + batchId);
        }
        item.setPicked(true);
        item.setPickedAt(LocalDateTime.now());
        return PickBatchItemResponse.from(pickBatchItemRepository.save(item));
    }

    public PickBatchResponse completeBatch(UUID batchId) {
        PickBatch batch = findBatch(batchId);
        requireStatus(batch, BatchStatus.ACTIVE);
        batch.setStatus(BatchStatus.COMPLETE);
        batch.setCompletedAt(LocalDateTime.now());

        // Transition each order PICKING → PACKED
        batch.getBatchOrders().forEach(bo -> {
            Order order = bo.getOrder();
            if (order.getStatus() == OrderStatus.PICKING) {
                orderLifecycleService.pack(order.getId());
            }
        });

        return toResponse(pickBatchRepository.save(batch));
    }

    private PickBatch findBatch(UUID id) {
        return pickBatchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Batch not found: " + id));
    }

    private void requireStatus(PickBatch batch, BatchStatus expected) {
        if (batch.getStatus() != expected) {
            throw new IllegalStateException("Batch " + batch.getId() + " is " + batch.getStatus()
                    + " — expected: " + expected);
        }
    }

    private PickBatchResponse toResponse(PickBatch batch) {
        List<PickBatchItemResponse> items = pickBatchItemRepository
                .findByBatchIdOrderBySortOrderAsc(batch.getId())
                .stream()
                .map(PickBatchItemResponse::from)
                .toList();
        return PickBatchResponse.from(batch, items);
    }
}
