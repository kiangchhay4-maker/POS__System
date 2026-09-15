package com.coffeeshop.order.repository;

import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") UUID id);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id AND o.customerId = :customerId")
    Optional<Order> findByIdAndCustomerIdWithItems(@Param("id") UUID id, @Param("customerId") UUID customerId);

    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("""
        SELECT o FROM Order o
        WHERE (:status IS NULL OR o.status = :status)
          AND (:customerId IS NULL OR o.customerId = :customerId)
    """)
    Page<Order> searchOrders(
            @Param("status") OrderStatus status,
            @Param("customerId") UUID customerId,
            Pageable pageable
    );
}
