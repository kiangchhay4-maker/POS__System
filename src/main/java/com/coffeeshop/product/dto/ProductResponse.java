package com.coffeeshop.product.dto;

import com.coffeeshop.product.entity.Product;
import com.coffeeshop.product.entity.ProductCategory;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        ProductCategory category,
        BigDecimal price,
        String currency,
        boolean available
) {
    public static ProductResponse fromEntity(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getPrice(),
                product.getCurrency(),
                product.isAvailable()
        );
    }
}
