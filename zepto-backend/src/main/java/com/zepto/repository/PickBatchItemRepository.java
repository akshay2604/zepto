package com.zepto.repository;

import com.zepto.entity.PickBatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PickBatchItemRepository extends JpaRepository<PickBatchItem, UUID> {
    List<PickBatchItem> findByBatchIdOrderBySortOrderAsc(UUID batchId);

    @Query("SELECT DISTINCT i.zoneType FROM PickBatchItem i WHERE i.batch.warehouse.id = :warehouseId " +
           "AND i.picked = false AND i.batch.status <> com.zepto.entity.enums.BatchStatus.COMPLETE")
    List<com.zepto.entity.enums.ZoneType> findActiveZoneTypes(@Param("warehouseId") UUID warehouseId);
}
