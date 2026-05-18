package com.zepto.repository;

import com.zepto.entity.PickBatch;
import com.zepto.entity.enums.BatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PickBatchRepository extends JpaRepository<PickBatch, UUID> {
    List<PickBatch> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId);
    List<PickBatch> findByWarehouseIdAndStatusOrderByCreatedAtDesc(UUID warehouseId, BatchStatus status);
    long countByWarehouseIdAndStatus(UUID warehouseId, BatchStatus status);
}
