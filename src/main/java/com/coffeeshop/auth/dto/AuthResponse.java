package com.coffeeshop.auth.dto;

import com.coffeeshop.common.security.Role;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String name,
        String phone,
        Role role,
        String accessToken,
        String refreshToken
) {}
