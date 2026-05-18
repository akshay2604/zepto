package com.zepto.repository;

import com.zepto.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RiderRepository extends JpaRepository<Rider, UUID> {
    List<Rider> findByActiveTrueOrderByNameAsc();
    List<Rider> findAllByOrderByNameAsc();
    List<Rider> findByWarehouseIdAndActiveTrueOrderByNameAsc(UUID warehouseId);
    List<Rider> findByWarehouseId(UUID warehouseId);
    void deleteByWarehouseId(UUID warehouseId);
}
