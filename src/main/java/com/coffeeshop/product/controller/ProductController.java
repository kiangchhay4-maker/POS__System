package com.coffeeshop.product.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.response.PageMeta;
import com.coffeeshop.product.dto.ProductResponse;
import com.coffeeshop.product.entity.ProductCategory;
import com.coffeeshop.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Public product browsing and search endpoints")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(summary = "Browse products with pagination, category filter, and sorting")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) Boolean available,
            @PageableDefault(page = 0, size = 20, sort = "price", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<ProductResponse> pageResult = productService.findProducts(category, available, pageable);
        PageMeta meta = PageMeta.fromPage(pageResult);
        return ResponseEntity.ok(ApiResponse.success(pageResult.getContent(), meta));
    }

    @Operation(summary = "Get product details by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable UUID id) {
        ProductResponse response = productService.findProductById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
