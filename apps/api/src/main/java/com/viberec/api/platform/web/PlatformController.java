package com.viberec.api.platform.web;

import java.time.OffsetDateTime;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class PlatformController {

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "application", "vibe-rec-api",
                "status", "ok",
                "timestamp", OffsetDateTime.now().toString()
        );
    }
}

