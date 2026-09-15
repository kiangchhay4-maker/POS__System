package com.coffeeshop.inventory.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.inventory.dto.InventoryResponse;
import com.coffeeshop.inventory.dto.UpdateInventoryStockRequest;
import com.coffeeshop.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@Tag(name = "Admin Inventory", description = "Endpoints for staff and admin inventory management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    public AdminInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Operation(summary = "Get product inventory stock level")
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<InventoryResponse>> getInventory(@PathVariable UUID productId) {
        InventoryResponse response = inventoryService.getInventory(productId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update on-hand or replenish product stock")
    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustStock(
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateInventoryStockRequest request
    ) {
        InventoryResponse response = inventoryService.adjustStock(productId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
