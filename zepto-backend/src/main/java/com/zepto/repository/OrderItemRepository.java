package com.zepto.repository;

import com.zepto.entity.OrderItem;
import com.zepto.entity.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderId(UUID orderId);

    // Top N variants by total qty sold in delivered orders
    @Query("""
            SELECT oi.variant.id,
                   oi.variant.displayName,
                   oi.variant.skuCode,
                   SUM(oi.qty)
            FROM   OrderItem oi
            JOIN   oi.order o
            WHERE  o.status = :status
            GROUP  BY oi.variant.id, oi.variant.displayName, oi.variant.skuCode
            ORDER  BY SUM(oi.qty) DESC
            """)
    List<Object[]> findTopVariantsByOrderStatus(@Param("status") OrderStatus status, Pageable pageable);

    void deleteByOrderIdIn(java.util.Collection<UUID> orderIds);
}
