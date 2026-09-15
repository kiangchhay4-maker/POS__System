package com.coffeeshop.order.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.response.PageMeta;
import com.coffeeshop.order.dto.OrderResponse;
import com.coffeeshop.order.entity.OrderStatus;
import com.coffeeshop.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@Tag(name = "Admin Orders", description = "Endpoints for administrator order tracking and analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Admin search and list all orders across system")
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> searchAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) UUID customerId,
            @PageableDefault(page = 0, size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<OrderResponse> pageResult = orderService.searchOrders(status, customerId, pageable);
        PageMeta meta = PageMeta.fromPage(pageResult);
        return ResponseEntity.ok(ApiResponse.success(pageResult.getContent(), meta));
    }
}
