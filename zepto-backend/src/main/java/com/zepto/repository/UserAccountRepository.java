package com.zepto.repository;

import com.zepto.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    List<UserAccount> findByActiveTrue();

    boolean existsByPhone(String phone);

    java.util.Optional<UserAccount> findByPhone(String phone);

    List<UserAccount> findByWarehouseId(UUID warehouseId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE UserAccount u SET u.warehouse = null WHERE u.warehouse.id = :warehouseId")
    void unassignWarehouse(@org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId);
}
