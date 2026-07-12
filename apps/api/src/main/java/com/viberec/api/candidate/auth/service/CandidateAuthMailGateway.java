package com.viberec.api.candidate.auth.service;

public interface CandidateAuthMailGateway {
    void send(String recipientEmail, String subject, String content);
}
