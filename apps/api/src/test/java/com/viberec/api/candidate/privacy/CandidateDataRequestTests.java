package com.viberec.api.candidate.privacy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.privacy.service.AdminCandidateDataRequestService;
import com.viberec.api.admin.privacy.web.UpdateCandidateDataRequestRequest;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestType;
import com.viberec.api.candidate.privacy.repository.CandidateDataRequestEventRepository;
import com.viberec.api.candidate.privacy.repository.CandidateDataRequestRepository;
import com.viberec.api.candidate.privacy.service.CandidateDataRequestService;
import com.viberec.api.candidate.privacy.web.CreateCandidateDataRequest;
import com.viberec.api.support.IntegrationTestBase;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

class CandidateDataRequestTests extends IntegrationTestBase {

    @Autowired private CandidateDataRequestService candidateDataRequestService;
    @Autowired private AdminCandidateDataRequestService adminDataRequestService;
    @Autowired private CandidateDataRequestRepository requestRepository;
    @Autowired private CandidateDataRequestEventRepository eventRepository;
    @Autowired private CandidateSessionRepository candidateSessionRepository;
    @Autowired private CandidateAccountRepository candidateAccountRepository;
    @Autowired private AdminAccountRepository adminAccountRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    @BeforeEach
    void cleanDataRequests() {
        eventRepository.deleteAll();
        requestRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void preventsDuplicateActiveRequestAndAllowsReplacementAfterCancellation() {
        var candidate = createCandidateAccount("Privacy Kim", "privacy.kim@example.com", "010-1112-1314");
        var first = candidateDataRequestService.create(
                candidate,
                new CreateCandidateDataRequest(CandidateDataRequestType.DATA_EXPORT, "Please export my data.")
        );

        assertThatThrownBy(() -> candidateDataRequestService.create(
                candidate,
                new CreateCandidateDataRequest(CandidateDataRequestType.DATA_EXPORT, "Duplicate request")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        var cancelled = candidateDataRequestService.cancel(first.id(), candidate);
        var replacement = candidateDataRequestService.create(
                candidate,
                new CreateCandidateDataRequest(CandidateDataRequestType.DATA_EXPORT, "New export request")
        );

        assertThat(cancelled.status()).isEqualTo(CandidateDataRequestStatus.CANCELLED);
        assertThat(replacement.id()).isNotEqualTo(first.id());
        assertThat(candidateDataRequestService.getRequests(candidate)).hasSize(2);
    }

    @Test
    void enforcesOwnershipAndAuditsAdminResolutionWorkflow() {
        var candidate = createCandidateAccount("Delete Kim", "delete.kim@example.com", "010-2122-2324");
        var otherCandidate = createCandidateAccount("Other Kim", "privacy.other@example.com", "010-3132-3334");
        var created = candidateDataRequestService.create(
                candidate,
                new CreateCandidateDataRequest(CandidateDataRequestType.DATA_DELETION, "Delete my account data.")
        );
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        assertThatThrownBy(() -> candidateDataRequestService.cancel(created.id(), otherCandidate))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        var inReview = adminDataRequestService.update(
                created.id(),
                adminId,
                new UpdateCandidateDataRequestRequest(CandidateDataRequestStatus.IN_REVIEW, "Identity verified.")
        );
        assertThat(inReview.status()).isEqualTo(CandidateDataRequestStatus.IN_REVIEW);

        assertThatThrownBy(() -> adminDataRequestService.update(
                created.id(),
                adminId,
                new UpdateCandidateDataRequestRequest(CandidateDataRequestStatus.COMPLETED, " ")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        var completed = adminDataRequestService.update(
                created.id(),
                adminId,
                new UpdateCandidateDataRequestRequest(
                        CandidateDataRequestStatus.COMPLETED,
                        "Deletion completed under retention policy exception for audit records."
                )
        );

        assertThat(completed.status()).isEqualTo(CandidateDataRequestStatus.COMPLETED);
        assertThat(completed.completedAt()).isNotNull();
        assertThat(completed.events())
                .extracting("toStatus")
                .containsExactly("REQUESTED", "IN_REVIEW", "COMPLETED");
        assertThat(completed.events().get(1).actorType()).isEqualTo("ADMIN");
        assertThat(candidateDataRequestService.getRequests(candidate).getFirst().resolutionNote())
                .contains("retention policy");
    }

    @Test
    void serializesCandidateCancellationAgainstAdminReview() throws Exception {
        var candidate = createCandidateAccount("Concurrent Privacy Kim", "privacy.race@example.com", "010-4142-4344");
        var created = candidateDataRequestService.create(
                candidate,
                new CreateCandidateDataRequest(CandidateDataRequestType.DATA_DELETION, "Delete my data.")
        );
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();
        var lockAcquired = new CountDownLatch(1);
        var releaseLock = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        try {
            var adminTransition = executor.submit(() -> {
                new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                    var dataRequest = requestRepository.findByIdForUpdate(created.id()).orElseThrow();
                    dataRequest.startReview(adminId, "Identity verified.");
                    lockAcquired.countDown();
                    await(releaseLock);
                });
                return null;
            });
            assertThat(lockAcquired.await(5, TimeUnit.SECONDS)).isTrue();

            var cancellation = executor.submit(() -> candidateDataRequestService.cancel(created.id(), candidate));
            assertThatThrownBy(() -> cancellation.get(250, TimeUnit.MILLISECONDS))
                    .isInstanceOf(TimeoutException.class);

            releaseLock.countDown();
            adminTransition.get(5, TimeUnit.SECONDS);
            assertThatThrownBy(() -> cancellation.get(5, TimeUnit.SECONDS))
                    .isInstanceOf(ExecutionException.class)
                    .hasCauseInstanceOf(ResponseStatusException.class);
            assertThat(requestRepository.findById(created.id()).orElseThrow().getStatus())
                    .isEqualTo(CandidateDataRequestStatus.IN_REVIEW);
        } finally {
            releaseLock.countDown();
            executor.shutdownNow();
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for concurrent test release.");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Concurrent test was interrupted.", exception);
        }
    }
}
