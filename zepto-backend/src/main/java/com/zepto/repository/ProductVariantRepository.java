package com.zepto.repository;

import com.zepto.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findByAvailableTrue();

    List<ProductVariant> findByProductIdAndAvailableTrue(UUID productId);

    List<ProductVariant> findByProductId(UUID productId);
}
