package com.viberec.api.platform.web;

import com.viberec.api.platform.security.AuthenticationRateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @ExceptionHandler(AuthenticationRateLimitExceededException.class)
    ResponseEntity<ApiErrorResponse> handleAuthenticationRateLimit(
            AuthenticationRateLimitExceededException exception,
            HttpServletRequest request
    ) {
        String requestId = resolveRequestId(request);
        long retryAfterMillis = Math.max(
                1,
                Duration.between(OffsetDateTime.now(), exception.getRetryAt()).toMillis()
        );
        long retryAfterSeconds = Math.max(1, (retryAfterMillis + 999) / 1000);
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(REQUEST_ID_HEADER, requestId)
                .header("Retry-After", Long.toString(retryAfterSeconds))
                .body(new ApiErrorResponse(
                        "AUTH_RATE_LIMITED",
                        exception.getMessage(),
                        requestId,
                        Map.of()
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage())
        );
        return response(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "입력값을 확인해 주세요.",
                request,
                fieldErrors
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiErrorResponse> handleResponseStatus(
            ResponseStatusException exception,
            HttpServletRequest request
    ) {
        String message = exception.getReason();
        if (message == null || message.isBlank()) {
            message = "요청을 처리할 수 없습니다.";
        }
        return response(
                exception.getStatusCode(),
                "REQUEST_REJECTED",
                message,
                request,
                Map.of()
        );
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ApiErrorResponse> handleOptimisticLock(
            ObjectOptimisticLockingFailureException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.CONFLICT,
                "CONCURRENT_UPDATE",
                "다른 화면에서 데이터가 변경되었습니다. 최신 내용을 다시 불러와 주세요.",
                request,
                Map.of()
        );
    }

    @ExceptionHandler(ErrorResponseException.class)
    ResponseEntity<ApiErrorResponse> handleFrameworkError(
            ErrorResponseException exception,
            HttpServletRequest request
    ) {
        String message = exception.getStatusCode().value() == 404
                ? "요청한 경로를 찾을 수 없습니다."
                : "요청을 처리할 수 없습니다.";
        return response(
                exception.getStatusCode(),
                "REQUEST_FAILED",
                message,
                request,
                Map.of()
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(
            NoResourceFoundException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                "요청한 경로를 찾을 수 없습니다.",
                request,
                Map.of()
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiErrorResponse> handleUnreadableMessage(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST_BODY",
                "요청 본문 형식이 올바르지 않습니다.",
                request,
                Map.of()
        );
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.error("Unhandled API error. requestId={}", requestId, exception);
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "요청 처리 중 오류가 발생했습니다.",
                requestId,
                Map.of()
        );
    }

    private ResponseEntity<ApiErrorResponse> response(
            org.springframework.http.HttpStatusCode status,
            String code,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        return response(status, code, message, resolveRequestId(request), fieldErrors);
    }

    private ResponseEntity<ApiErrorResponse> response(
            org.springframework.http.HttpStatusCode status,
            String code,
            String message,
            String requestId,
            Map<String, String> fieldErrors
    ) {
        return ResponseEntity.status(status)
                .header(REQUEST_ID_HEADER, requestId)
                .body(new ApiErrorResponse(code, message, requestId, fieldErrors));
    }

    private String resolveRequestId(HttpServletRequest request) {
        String suppliedRequestId = request.getHeader(REQUEST_ID_HEADER);
        if (suppliedRequestId != null && suppliedRequestId.matches("[A-Za-z0-9._-]{1,100}")) {
            return suppliedRequestId;
        }
        return UUID.randomUUID().toString();
    }
}
