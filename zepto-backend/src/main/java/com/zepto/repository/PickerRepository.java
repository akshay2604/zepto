package com.zepto.repository;

import com.zepto.entity.Picker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PickerRepository extends JpaRepository<Picker, UUID> {
    List<Picker> findByWarehouseIdAndActiveTrue(UUID warehouseId);
    List<Picker> findByWarehouseId(UUID warehouseId);
}
