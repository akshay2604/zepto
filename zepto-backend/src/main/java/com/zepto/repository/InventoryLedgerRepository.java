package com.zepto.repository;

import com.zepto.entity.InventoryLedger;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryLedgerRepository extends JpaRepository<InventoryLedger, UUID> {

    Optional<InventoryLedger> findByWarehouseIdAndVariantId(UUID warehouseId, UUID variantId);

    // Pessimistic write lock — used when mutating qty_reserved or qty_on_hand
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT il FROM InventoryLedger il WHERE il.warehouse.id = :warehouseId AND il.variant.id = :variantId")
    Optional<InventoryLedger> findByWarehouseIdAndVariantIdWithLock(
            @Param("warehouseId") UUID warehouseId,
            @Param("variantId") UUID variantId);

    @Query("SELECT il FROM InventoryLedger il JOIN FETCH il.variant JOIN FETCH il.warehouse")
    List<InventoryLedger> findAllWithVariantAndWarehouse();

    List<InventoryLedger> findByQtyOnHandLessThanEqual(int threshold);

    List<InventoryLedger> findByWarehouseId(UUID warehouseId);
}
