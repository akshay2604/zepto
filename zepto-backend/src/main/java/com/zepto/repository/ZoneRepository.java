package com.zepto.repository;

import com.zepto.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ZoneRepository extends JpaRepository<Zone, UUID> {
    List<Zone> findByWarehouseIdOrderByDisplayOrderAsc(UUID warehouseId);
    boolean existsByWarehouseId(UUID warehouseId);
}
