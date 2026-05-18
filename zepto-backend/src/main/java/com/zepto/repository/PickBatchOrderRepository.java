package com.zepto.repository;

import com.zepto.entity.PickBatchOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PickBatchOrderRepository extends JpaRepository<PickBatchOrder, UUID> {
    List<PickBatchOrder> findByBatchId(UUID batchId);
}
