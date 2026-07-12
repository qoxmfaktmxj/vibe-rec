package com.viberec.api.admin.auth.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.platform.permission.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

public class PermissionInterceptor implements HandlerInterceptor {

    private final AdminAuthService adminAuthService;
    private final PermissionService permissionService;

    public PermissionInterceptor(AdminAuthService adminAuthService, PermissionService permissionService) {
        this.adminAuthService = adminAuthService;
        this.permissionService = permissionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        String sessionToken = request.getHeader("X-Admin-Session");
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "관리자 세션이 없거나 만료되었습니다.");
        }

        AdminSessionResponse session = adminAuthService.getSession(sessionToken);
        RequiresPermission annotation = handlerMethod.getMethodAnnotation(RequiresPermission.class);
        if (annotation == null) {
            if (handlerMethod.hasMethodAnnotation(RequiresAdminSession.class)) {
                return true;
            }
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "관리자 엔드포인트에 필요한 권한이 설정되지 않았습니다."
            );
        }

        String role = session.role().name();
        String requiredPermission = annotation.value();

        if (!permissionService.hasPermission(role, requiredPermission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }

        return true;
    }
}
