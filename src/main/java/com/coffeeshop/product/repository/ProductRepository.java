package com.coffeeshop.product.repository;

import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.entity.ProductCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("""
        SELECT p FROM Product p
        WHERE (:category IS NULL OR p.category = :category)
          AND (:available IS NULL OR p.available = :available)
    """)
    Page<Product> searchProducts(
            @Param("category") ProductCategory category,
            @Param("available") Boolean available,
            Pageable pageable
    );

    Optional<Product> findByIdAndAvailableTrue(UUID id);
}
