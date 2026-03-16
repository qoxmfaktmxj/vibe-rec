package com.viberec.api.admin.auth.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.platform.permission.service.PermissionService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdminWebConfig implements WebMvcConfigurer {

    private final AdminAuthService adminAuthService;
    private final PermissionService permissionService;

    public AdminWebConfig(AdminAuthService adminAuthService, PermissionService permissionService) {
        this.adminAuthService = adminAuthService;
        this.permissionService = permissionService;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new PermissionInterceptor(adminAuthService, permissionService))
                .addPathPatterns("/admin/**");
    }
}
