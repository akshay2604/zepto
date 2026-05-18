package com.zepto.repository;

import com.zepto.entity.StockMovement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    List<StockMovement> findTop20ByOrderByCreatedAtDesc();

    // Eagerly joins variant to avoid N+1 in analytics
    @Query("SELECT sm FROM StockMovement sm JOIN FETCH sm.variant ORDER BY sm.createdAt DESC")
    List<StockMovement> findRecentWithVariant(Pageable pageable);

    void deleteByReferenceId(UUID referenceId);
    void deleteByWarehouseId(UUID warehouseId);
}
