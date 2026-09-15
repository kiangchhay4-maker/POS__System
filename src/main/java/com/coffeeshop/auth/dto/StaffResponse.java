package com.coffeeshop.auth.dto;

import com.coffeeshop.auth.entity.User;
import com.coffeeshop.common.security.Role;

import java.time.Instant;
import java.util.UUID;

public record StaffResponse(
        UUID id,
        String name,
        String phone,
        Role role,
        boolean active,
        Instant createdAt
) {
    public static StaffResponse fromUser(User user) {
        return new StaffResponse(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
