package com.coffeeshop.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.data.domain.Page;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PageMeta(
        int page,
        int size,
        long totalElements,
        int totalPages,
        String requestId
) {
    public static PageMeta of(int page, int size, long totalElements, int totalPages) {
        return new PageMeta(page, size, totalElements, totalPages, null);
    }

    public static PageMeta of(int page, int size, long totalElements, int totalPages, String requestId) {
        return new PageMeta(page, size, totalElements, totalPages, requestId);
    }

    public static PageMeta fromPage(Page<?> page) {
        return new PageMeta(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                null
        );
    }

    public static PageMeta withRequestId(String requestId) {
        return new PageMeta(0, 0, 0, 0, requestId);
    }
}
