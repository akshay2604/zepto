package com.zepto.repository;

import com.zepto.entity.PickBatchOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import com.zepto.entity.enums.BatchStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface PickBatchOrderRepository extends JpaRepository<PickBatchOrder, UUID> {
    List<PickBatchOrder> findByBatchId(UUID batchId);

    @Query("SELECT pbo.order.id FROM PickBatchOrder pbo WHERE pbo.batch.warehouse.id = :warehouseId " +
           "AND pbo.batch.status <> :excludeStatus")
    Set<UUID> findAlreadyBatchedOrderIds(@Param("warehouseId") UUID warehouseId,
                                         @Param("excludeStatus") BatchStatus excludeStatus);
}
