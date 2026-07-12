package com.viberec.api.candidate.auth.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "spring.mail.host",
        havingValue = "__disabled__",
        matchIfMissing = true
)
public class UnavailableCandidateAuthMailGateway implements CandidateAuthMailGateway {
    @Override
    public void send(String recipientEmail, String subject, String content) {
        throw new IllegalStateException("SMTP delivery is not configured.");
    }
}
