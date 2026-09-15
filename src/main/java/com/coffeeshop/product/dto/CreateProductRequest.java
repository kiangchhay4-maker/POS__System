package com.coffeeshop.product.dto;

import com.coffeeshop.product.entity.ProductCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateProductRequest(
        @NotBlank(message = "Product name cannot be blank")
        @Size(min = 2, max = 150, message = "Product name must be between 2 and 150 characters")
        String name,

        String description,

        @NotNull(message = "Category must be specified")
        ProductCategory category,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be strictly positive")
        BigDecimal price,

        String currency,

        Boolean available,

        Integer initialStock
) {}
