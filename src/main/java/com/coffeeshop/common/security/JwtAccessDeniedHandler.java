package com.coffeeshop.common.security;

import com.coffeeshop.common.exception.ErrorCode;
import com.coffeeshop.common.response.ApiError;
import com.coffeeshop.common.response.ApiResponse;
import com.coffeeshop.common.util.JsonUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        ApiResponse<Void> apiResponse = ApiResponse.error(
                ApiError.of(
                        ErrorCode.AUTH_ACCESS_DENIED.name(),
                        "Access is denied: You do not possess the required permissions."
                )
        );

        response.getWriter().write(JsonUtil.toJson(apiResponse));
    }
}
