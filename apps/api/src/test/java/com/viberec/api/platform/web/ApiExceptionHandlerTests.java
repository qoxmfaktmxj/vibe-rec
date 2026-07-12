package com.viberec.api.platform.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ApiExceptionHandlerTests {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();
    private final HttpServletRequest request = mock(HttpServletRequest.class);

    @Test
    void preservesControlledBusinessMessageAndRequestId() {
        when(request.getHeader("X-Request-Id")).thenReturn("request-123");

        var response = handler.handleResponseStatus(
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 질문에 답변해 주세요."),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getHeaders().getFirst("X-Request-Id")).isEqualTo("request-123");
        assertThat(response.getBody())
                .extracting(ApiErrorResponse::code, ApiErrorResponse::message, ApiErrorResponse::requestId)
                .containsExactly("REQUEST_REJECTED", "필수 질문에 답변해 주세요.", "request-123");
    }

    @Test
    void hidesUnexpectedExceptionDetails() {
        when(request.getHeader("X-Request-Id")).thenReturn("request-456");

        var response = handler.handleUnexpected(
                new IllegalStateException("jdbc:postgresql://secret-host/password=secret"),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message())
                .isEqualTo("요청 처리 중 오류가 발생했습니다.")
                .doesNotContain("secret", "jdbc");
        assertThat(response.getBody().requestId()).isEqualTo("request-456");
    }
}
