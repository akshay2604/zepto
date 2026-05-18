package com.zepto.repository;

import com.zepto.entity.Order;
import com.zepto.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    List<Order> findByStatus(OrderStatus status);

    List<Order> findTop5ByOrderByPlacedAtDesc();

    Optional<Order> findFirstByStatusNotInOrderByPlacedAtAsc(Collection<OrderStatus> terminalStatuses);

    List<Order> findByUserIdOrderByPlacedAtDesc(UUID userId);

    long countByStatus(OrderStatus status);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countGroupedByStatus();

    List<Order> findByWarehouseId(UUID warehouseId);
}
