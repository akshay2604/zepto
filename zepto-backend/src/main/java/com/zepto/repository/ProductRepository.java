package com.zepto.repository;

import com.zepto.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByActiveTrue();

    List<Product> findByCategoryIdAndActiveTrue(UUID categoryId);
}
