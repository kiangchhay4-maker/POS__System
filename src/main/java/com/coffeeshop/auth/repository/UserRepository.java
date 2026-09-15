package com.coffeeshop.auth.repository;

import com.coffeeshop.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByNameIgnoreCase(String name);

    boolean existsByPhone(String phone);

    java.util.List<User> findByRole(com.coffeeshop.common.security.Role role);
}
