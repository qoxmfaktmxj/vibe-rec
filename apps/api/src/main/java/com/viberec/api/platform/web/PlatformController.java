package com.viberec.api.platform.web;

import java.time.OffsetDateTime;
import java.util.Map;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class PlatformController {

    private final String applicationName;

    public PlatformController(Environment environment) {
        this.applicationName = environment.getProperty("spring.application.name", "hireflow-api");
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "application", applicationName,
                "status", "ok",
                "timestamp", OffsetDateTime.now().toString()
        );
    }
}

