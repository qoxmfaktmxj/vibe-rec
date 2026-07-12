package com.viberec.api.candidate.auth.service;

import com.viberec.api.candidate.auth.domain.CandidateAuthMailDeliveryStatus;
import com.viberec.api.candidate.auth.domain.CandidateAuthMailOutbox;
import com.viberec.api.candidate.auth.repository.CandidateAuthMailOutboxRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CandidateAuthMailOutboxDispatcher {

    private final CandidateAuthMailOutboxRepository repository;
    private final CandidateAuthMailGateway mailGateway;

    public CandidateAuthMailOutboxDispatcher(
            CandidateAuthMailOutboxRepository repository,
            CandidateAuthMailGateway mailGateway
    ) {
        this.repository = repository;
        this.mailGateway = mailGateway;
    }

    @Scheduled(
            fixedDelayString = "${app.candidate.mail.dispatch-interval-ms:5000}",
            initialDelayString = "${app.candidate.mail.dispatch-initial-delay-ms:5000}"
    )
    @Transactional
    public int dispatchPending() {
        List<CandidateAuthMailOutbox> mails = repository.findDispatchable(
                List.of(CandidateAuthMailDeliveryStatus.PENDING, CandidateAuthMailDeliveryStatus.FAILED),
                OffsetDateTime.now(),
                PageRequest.of(0, 50)
        );
        int delivered = 0;
        for (CandidateAuthMailOutbox mail : mails) {
            try {
                mailGateway.send(mail.getRecipientEmail(), mail.getSubject(), mail.getContent());
                mail.markDelivered();
                delivered++;
            } catch (RuntimeException exception) {
                String message = exception.getMessage();
                mail.markFailed(exception.getClass().getSimpleName() + (message == null ? "" : ": " + message));
            }
        }
        return delivered;
    }
}
