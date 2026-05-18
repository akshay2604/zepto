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
}
