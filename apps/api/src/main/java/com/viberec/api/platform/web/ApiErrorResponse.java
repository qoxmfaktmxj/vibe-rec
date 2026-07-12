package com.viberec.api.platform.web;

import java.util.Map;

public record ApiErrorResponse(
        String code,
        String message,
        String requestId,
        Map<String, String> fieldErrors
) {
}
