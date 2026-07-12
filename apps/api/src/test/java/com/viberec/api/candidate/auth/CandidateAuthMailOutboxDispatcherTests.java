package com.viberec.api.candidate.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.domain.CandidateAuthMailDeliveryStatus;
import com.viberec.api.candidate.auth.domain.CandidateAuthMailOutbox;
import com.viberec.api.candidate.auth.domain.CandidateAuthTokenPurpose;
import com.viberec.api.candidate.auth.repository.CandidateAuthMailOutboxRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthMailGateway;
import com.viberec.api.candidate.auth.service.CandidateAuthMailOutboxDispatcher;
import java.util.List;
import org.junit.jupiter.api.Test;

class CandidateAuthMailOutboxDispatcherTests {

    private final CandidateAuthMailOutboxRepository repository = mock(CandidateAuthMailOutboxRepository.class);
    private final CandidateAuthMailGateway gateway = mock(CandidateAuthMailGateway.class);
    private final CandidateAuthMailOutboxDispatcher dispatcher = new CandidateAuthMailOutboxDispatcher(repository, gateway);

    @Test
    void removesSensitiveLinkAfterSuccessfulDelivery() {
        CandidateAuthMailOutbox mail = mail();
        when(repository.findDispatchable(any(), any(), any())).thenReturn(List.of(mail));

        assertThat(dispatcher.dispatchPending()).isEqualTo(1);
        assertThat(mail.getDeliveryStatus()).isEqualTo(CandidateAuthMailDeliveryStatus.DELIVERED);
        assertThat(mail.getDeliveryAttempts()).isEqualTo(1);
        assertThat(mail.getDeliveredAt()).isNotNull();
        assertThat(mail.getContent()).isNull();
    }

    @Test
    void preservesPendingMailAndSchedulesRetryOnProviderFailure() {
        CandidateAuthMailOutbox mail = mail();
        when(repository.findDispatchable(any(), any(), any())).thenReturn(List.of(mail));
        doThrow(new IllegalStateException("SMTP unavailable"))
                .when(gateway)
                .send(any(), any(), any());

        assertThat(dispatcher.dispatchPending()).isZero();
        assertThat(mail.getDeliveryStatus()).isEqualTo(CandidateAuthMailDeliveryStatus.FAILED);
        assertThat(mail.getDeliveryAttempts()).isEqualTo(1);
        assertThat(mail.getNextAttemptAt()).isNotNull();
        assertThat(mail.getContent()).contains("token=raw-token");
        assertThat(mail.getLastError()).contains("SMTP unavailable");

        for (int attempt = 1; attempt < 5; attempt++) {
            mail.markFailed("SMTP unavailable");
        }
        assertThat(mail.getNextAttemptAt()).isNull();
        assertThat(mail.getContent()).isNull();
    }

    private CandidateAuthMailOutbox mail() {
        return new CandidateAuthMailOutbox(
                mock(CandidateAccount.class),
                CandidateAuthTokenPurpose.EMAIL_VERIFICATION,
                "candidate@example.com",
                "Verify email",
                "https://example.com/auth/verify-email?token=raw-token"
        );
    }
}
