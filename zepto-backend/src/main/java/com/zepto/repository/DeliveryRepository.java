package com.zepto.repository;

import com.zepto.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    Optional<Delivery> findByOrderId(UUID orderId);

    @Query("SELECT AVG(d.deliveryTimeSecs), COUNT(d) FROM Delivery d WHERE d.deliveryTimeSecs IS NOT NULL")
    List<Object[]> findAvgDeliveryTimeStats();

    void deleteByOrderIdIn(java.util.Collection<UUID> orderIds);
}
