package com.zepto.repository;

import com.zepto.entity.PickerZone;
import com.zepto.entity.enums.ZoneType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface PickerZoneRepository extends JpaRepository<PickerZone, UUID> {

    List<PickerZone> findByPickerId(UUID pickerId);

    void deleteByPickerId(UUID pickerId);

    @Query("SELECT pz.picker.id FROM PickerZone pz WHERE pz.picker.warehouse.id = :warehouseId " +
           "AND pz.picker.active = true AND pz.zoneType IN :zones " +
           "GROUP BY pz.picker.id HAVING COUNT(DISTINCT pz.zoneType) = :zoneCount")
    Set<UUID> findPickerIdsCoveringAllZones(@Param("warehouseId") UUID warehouseId,
                                            @Param("zones") Set<ZoneType> zones,
                                            @Param("zoneCount") long zoneCount);
}
