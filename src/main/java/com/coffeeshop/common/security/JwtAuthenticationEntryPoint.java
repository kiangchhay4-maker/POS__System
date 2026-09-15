package com.coffeeshop.common.security;

import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.response.ApiError;
import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.util.JsonUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        ApiResponse<Void> apiResponse = ApiResponse.error(
                ApiError.of(
                        ErrorCode.AUTH_INVALID_CREDENTIALS.name(),
                        "Full authentication is required to access this resource: " + authException.getMessage()
                )
        );

        response.getWriter().write(JsonUtil.toJson(apiResponse));
    }
}
