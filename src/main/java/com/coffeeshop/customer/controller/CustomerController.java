package com.coffeeshop.customer.controller;

import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.security.CurrentUser;
import com.coffeeshop.common.security.UserPrincipal;
import com.coffeeshop.customer.dto.CustomerProfileResponse;
import com.coffeeshop.customer.dto.UpdateCustomerProfileRequest;
import com.coffeeshop.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
@Tag(name = "Customer", description = "Endpoints for managing customer profile")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Operation(summary = "Get current customer profile")
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getMyProfile(@CurrentUser UserPrincipal principal) {
        CustomerProfileResponse response = customerService.getProfile(principal.id());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update current customer profile")
    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> updateMyProfile(
            @CurrentUser UserPrincipal principal,
            @Valid @RequestBody UpdateCustomerProfileRequest request
    ) {
        CustomerProfileResponse response = customerService.updateProfile(principal.id(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
