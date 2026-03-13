package com.viberec.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.viberec.api.platform.web.PlatformController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class VibeRecApiApplicationTests {

    @Autowired
    private PlatformController platformController;

    @Test
    void pingReturnsOkPayload() {
        Map<String, Object> payload = platformController.ping();

        assertThat(payload)
                .containsEntry("application", "vibe-rec-api")
                .containsEntry("status", "ok");
    }
}
