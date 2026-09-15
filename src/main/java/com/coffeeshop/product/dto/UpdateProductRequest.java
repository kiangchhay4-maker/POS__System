package com.coffeeshop.product.dto;

import com.coffeeshop.product.entity.ProductCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateProductRequest(
        @Size(min = 2, max = 150, message = "Product name must be between 2 and 150 characters")
        String name,

        String description,

        ProductCategory category,

        @DecimalMin(value = "0.01", message = "Price must be strictly positive")
        BigDecimal price,

        Boolean available
) {}
