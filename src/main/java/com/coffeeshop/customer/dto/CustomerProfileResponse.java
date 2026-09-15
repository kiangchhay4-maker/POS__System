package com.coffeeshop.customer.dto;

import com.coffeeshop.common.security.Role;

import java.time.Instant;
import java.util.UUID;

public record CustomerProfileResponse(
        UUID id,
        String name,
        String phone,
        Role role,
        Instant createdAt
) {}
