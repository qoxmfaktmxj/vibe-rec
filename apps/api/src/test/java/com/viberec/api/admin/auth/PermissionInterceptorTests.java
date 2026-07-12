package com.viberec.api.admin.auth;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminSessionResponse;
import com.viberec.api.admin.auth.web.PermissionInterceptor;
import com.viberec.api.platform.permission.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.server.ResponseStatusException;

class PermissionInterceptorTests {

    @Test
    void unannotatedAdminHandlerStillRequiresSession() throws NoSuchMethodException {
        var interceptor = new PermissionInterceptor(
                mock(AdminAuthService.class),
                mock(PermissionService.class)
        );
        var request = mock(HttpServletRequest.class);
        var response = mock(HttpServletResponse.class);
        var handler = new HandlerMethod(
                new UnannotatedAdminController(),
                UnannotatedAdminController.class.getDeclaredMethod("handle")
        );

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void authenticatedUnannotatedAdminHandlerIsDeniedByDefault() throws NoSuchMethodException {
        var adminAuthService = mock(AdminAuthService.class);
        var interceptor = new PermissionInterceptor(
                adminAuthService,
                mock(PermissionService.class)
        );
        var request = mock(HttpServletRequest.class);
        var response = mock(HttpServletResponse.class);
        var handler = new HandlerMethod(
                new UnannotatedAdminController(),
                UnannotatedAdminController.class.getDeclaredMethod("handle")
        );
        when(request.getHeader("X-Admin-Session")).thenReturn("session-token");
        when(adminAuthService.getSession("session-token")).thenReturn(mock(AdminSessionResponse.class));

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private static class UnannotatedAdminController {
        public void handle() {
        }
    }
}
