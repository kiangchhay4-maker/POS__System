package com.coffeeshop.order.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.response.PageMeta;
import com.coffeeshop.common.security.CurrentUser;
import com.coffeeshop.common.security.UserPrincipal;
import com.coffeeshop.order.dto.OrderResponse;
import com.coffeeshop.order.dto.UpdateOrderStatusRequest;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/orders")
@Tag(name = "Staff Orders", description = "Endpoints for staff order preparation and fulfillment workflow")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffOrderController {

    private final OrderService orderService;

    public StaffOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "List orders for staff dashboard with status filtering")
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getStaffOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(page = 0, size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<OrderResponse> pageResult = orderService.searchOrders(status, null, pageable);
        PageMeta meta = PageMeta.fromPage(pageResult);
        return ResponseEntity.ok(ApiResponse.success(pageResult.getContent(), meta));
    }

    @Operation(summary = "Advance order lifecycle status (e.g. CONFIRMED -> PREPARING -> READY -> COMPLETED)")
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @CurrentUser UserPrincipal principal,
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        OrderResponse response = orderService.updateOrderStatus(orderId, request.status(), principal.id(), principal.role());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
