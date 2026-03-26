package com.viberec.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.viberec.api.platform.web.PlatformController;
import com.viberec.api.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class VibeRecApiApplicationTests extends IntegrationTestBase {

    @Autowired
    private PlatformController platformController;

    @Test
    void pingReturnsOkPayload() {
        Map<String, Object> payload = platformController.ping();

        assertThat(payload)
                .containsEntry("application", "hireflow-api")
                .containsEntry("status", "ok");
    }
}
