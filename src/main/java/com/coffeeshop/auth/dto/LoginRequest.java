package com.coffeeshop.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Phone cannot be blank")
        String phone,

        @NotBlank(message = "Password cannot be blank")
        String password
) {}
