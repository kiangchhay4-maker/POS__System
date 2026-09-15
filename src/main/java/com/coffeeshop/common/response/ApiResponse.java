package com.coffeeshop.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error,
        PageMeta meta
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> success(T data, PageMeta meta) {
        return new ApiResponse<>(true, data, null, meta);
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return new ApiResponse<>(false, null, error, null);
    }

    public static <T> ApiResponse<T> error(ApiError error, PageMeta meta) {
        return new ApiResponse<>(false, null, error, meta);
    }

    public static <T> ApiResponse<T> partialFailure(T data, ApiError error) {
        return new ApiResponse<>(false, data, error, null);
    }

    public static <T> ApiResponse<T> partialFailure(T data, ApiError error, PageMeta meta) {
        return new ApiResponse<>(false, data, error, meta);
    }
}
