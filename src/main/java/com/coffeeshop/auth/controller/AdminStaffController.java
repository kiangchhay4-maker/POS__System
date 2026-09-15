package com.coffeeshop.auth.controller;

import com.coffeeshop.auth.dto.CreateStaffRequest;
import com.coffeeshop.auth.dto.StaffResponse;
import com.coffeeshop.auth.service.AuthService;
import com.coffeeshop.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/staff")
@Tag(name = "Admin Staff Management", description = "Endpoints for administrators to register and manage staff accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStaffController {

    private final AuthService authService;

    public AdminStaffController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Register a new staff/cashier account")
    @PostMapping
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        StaffResponse response = authService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @Operation(summary = "List all staff accounts")
    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffResponse>>> listStaff() {
        List<StaffResponse> response = authService.listStaff();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Delete staff account")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(@PathVariable java.util.UUID id) {
        authService.deleteStaff(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
