package com.viberec.api.admin.applicant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.applicant.repository.ApplicantTagRepository;
import com.viberec.api.admin.applicant.repository.ApplicationTagRepository;
import com.viberec.api.admin.applicant.repository.AdminApplicantSavedSearchRepository;
import com.viberec.api.admin.applicant.web.AddApplicantTagRequest;
import com.viberec.api.admin.applicant.web.AdminApplicantSortField;
import com.viberec.api.admin.applicant.web.AdminSortDirection;
import com.viberec.api.admin.applicant.web.BulkApplicantOperation;
import com.viberec.api.admin.applicant.web.BulkApplicantOperationRequest;
import com.viberec.api.admin.applicant.web.CreateAdminApplicantSavedSearchRequest;
import com.viberec.api.admin.applicant.web.UpdateApplicantAssigneeRequest;
import com.viberec.api.admin.applicant.service.AdminApplicantSavedSearchService;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.hiring.service.AdminHiringDecisionService;
import com.viberec.api.admin.hiring.web.FinalDecisionRequest;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.support.IntegrationTestBase;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.OptimisticLockException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class AdminApplicantTests extends IntegrationTestBase {

    @Autowired
    private AdminApplicantService adminApplicantService;

    @Autowired
    private ApplicationDraftService applicationDraftService;

    @Autowired
    private AdminHiringDecisionService adminHiringDecisionService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @Autowired
    private ApplicantTagRepository applicantTagRepository;

    @Autowired
    private ApplicationTagRepository applicationTagRepository;

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private ApplicationEventService applicationEventService;

    @Autowired
    private AdminApplicantSavedSearchService savedSearchService;

    @Autowired
    private AdminApplicantSavedSearchRepository savedSearchRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @BeforeEach
    void cleanApplications() {
        savedSearchRepository.deleteAll();
        applicationTagRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        applicantTagRepository.deleteAll();
    }

    @Test
    void returnsApplicantsWithSearchAndStatusFilters() {
        var backendCandidate = createCandidateAccount("Backend Kim", "backend.kim@example.com", "010-1111-2222");
        var draftCandidate = createCandidateAccount("Draft Park", "draft.park@example.com", "010-3333-4444");

        applicationDraftService.submit(
                1001L,
                backendCandidate,
                validSubmitRequest(1001L, Map.of(
                                "introduction", "I have built enterprise recruitment backends and migration tooling for hiring teams.",
                                "coreStrength", "I can stabilize hiring workflows while systems are being replaced."
                        ))
        );
        applicationDraftService.saveDraft(
                1001L,
                draftCandidate,
                new SaveApplicationDraftRequest(
                        Map.of("introduction", "draft only"),
                        null, null, null, null, null
                )
        );

        var submittedApplicants = adminApplicantService.getApplicants(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                null,
                null,
                null,
                "backend"
        );

        assertThat(submittedApplicants)
                .hasSize(1)
                .first()
                .extracting("applicantName", "reviewStatus")
                .containsExactly("Backend Kim", ApplicationReviewStatus.NEW);
    }

    @Test
    void returnsApplicantPagesForLargeResultSets() {
        for (int index = 1; index <= 55; index++) {
            var candidate = createCandidateAccount(
                    "Paged Candidate " + index,
                    "paged." + index + "@example.com",
                    "010-5000-" + String.format("%04d", index)
            );
            applicationDraftService.submit(
                    1001L,
                    candidate,
                    validSubmitRequest(1001L, Map.of(
                                    "introduction", "Paged applicant " + index + " has enough background to satisfy the submit validation rules.",
                                    "coreStrength", "Paged applicant " + index + " keeps the admin review queue structured."
                            ))
            );
        }

        var firstPage = adminApplicantService.getApplicantsPage(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                null,
                null,
                null,
                null,
                null,
                "paged candidate",
                AdminApplicantSortField.SUBMITTED_AT,
                AdminSortDirection.DESC,
                1,
                50
        );
        var secondPage = adminApplicantService.getApplicantsPage(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                null,
                null,
                null,
                null,
                null,
                "paged candidate",
                AdminApplicantSortField.SUBMITTED_AT,
                AdminSortDirection.DESC,
                2,
                50
        );

        assertThat(firstPage.totalItems()).isEqualTo(55);
        assertThat(firstPage.totalPages()).isEqualTo(2);
        assertThat(firstPage.items()).hasSize(50);
        assertThat(secondPage.items()).hasSize(5);
    }

    @Test
    void updatesReviewStatusForSubmittedApplication() {
        var candidate = createCandidateAccount("Review Kim", "review.kim@example.com", "010-7777-8888");
        var submittedApplication = applicationDraftService.submit(
                1001L,
                candidate,
                validSubmitRequest(1001L, Map.of(
                                "introduction", "I have owned applicant workflows and recruiter tools across multiple hiring platforms.",
                                "coreStrength", "I can convert business review rules into predictable operating flows."
                        ))
        );

        var inReview = adminApplicantService.updateReviewStatus(
                submittedApplication.applicationId(),
                new UpdateApplicantReviewStatusRequest(
                        ApplicationReviewStatus.IN_REVIEW,
                        "Initial recruiter review started."
                )
        );

        assertThat(inReview.reviewStatus()).isEqualTo(ApplicationReviewStatus.IN_REVIEW);
        assertThat(inReview.reviewNote()).isEqualTo("Initial recruiter review started.");
        assertThat(inReview.reviewedAt()).isNotNull();

        var passed = adminApplicantService.updateReviewStatus(
                submittedApplication.applicationId(),
                new UpdateApplicantReviewStatusRequest(
                        ApplicationReviewStatus.PASSED,
                        "Strong backend delivery background."
                )
        );

        assertThat(passed.reviewStatus()).isEqualTo(ApplicationReviewStatus.PASSED);
    }

    @Test
    void returnsApplicantDetailWithFinalDecisionFields() {
        var candidate = createCandidateAccount("Decision Kim", "decision.kim@example.com", "010-1212-3434");
        var submittedApplication = applicationDraftService.submit(
                1001L,
                candidate,
                validSubmitRequest(1001L, Map.of(
                                "introduction", "I have delivered applicant workflow APIs with explicit decision contracts.",
                                "coreStrength", "I keep admin detail responses aligned with persisted final decision state."
                        ))
        );

        adminApplicantService.updateReviewStatus(
                submittedApplication.applicationId(),
                new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.IN_REVIEW, "Review started.")
        );
        adminApplicantService.updateReviewStatus(
                submittedApplication.applicationId(),
                new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.PASSED, "Candidate passed review.")
        );
        adminHiringDecisionService.makeFinalDecision(
                submittedApplication.applicationId(),
                new FinalDecisionRequest(ApplicationFinalStatus.OFFER_MADE, "Offer sent.")
        );

        var applicant = adminApplicantService.getApplicant(submittedApplication.applicationId());

        assertThat(applicant.finalStatus()).isEqualTo(ApplicationFinalStatus.OFFER_MADE);
        assertThat(applicant.finalNote()).isEqualTo("Offer sent.");
        assertThat(applicant.finalDecidedAt()).isNotNull();
    }

    @Test
    void rejectsReviewStatusChangeForDraftApplication() {
        var candidate = createCandidateAccount("Draft Only", "draft.only@example.com", "010-9999-0000");
        var draftApplication = applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of("introduction", "This is still a draft."),
                        null, null, null, null, null
                )
        );

        assertThatThrownBy(() -> adminApplicantService.updateReviewStatus(
                draftApplication.applicationId(),
                new UpdateApplicantReviewStatusRequest(
                        ApplicationReviewStatus.IN_REVIEW,
                        "Should fail because the application was not submitted."
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void assignsAndTagsApplicantsWithFilteringSortingAndAuditHistory() {
        var alphaCandidate = createCandidateAccount("Alpha Candidate", "alpha@example.com", "010-1414-1515");
        var zuluCandidate = createCandidateAccount("Zulu Candidate", "zulu@example.com", "010-1616-1717");
        Long alphaApplicationId = applicationDraftService.submit(
                1001L,
                alphaCandidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "Alpha candidate has managed enterprise recruiting operations and assignment queues.",
                        "coreStrength", "Alpha candidate makes ownership and classification explicit."
                ))
        ).applicationId();
        applicationDraftService.submit(
                1001L,
                zuluCandidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "Zulu candidate provides a second record for deterministic server sorting.",
                        "coreStrength", "Zulu candidate validates tag and assignee filters."
                ))
        );
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        var assigned = adminApplicantService.updateAssignee(
                alphaApplicationId,
                new UpdateApplicantAssigneeRequest(adminId),
                adminId
        );
        var tagged = adminApplicantService.addTag(
                alphaApplicationId,
                new AddApplicantTagRequest("Priority Review"),
                adminId
        );
        Long tagId = tagged.tags().getFirst().id();

        assertThat(assigned.assignedAdminId()).isEqualTo(adminId);
        assertThat(tagged.tags()).extracting("name").containsExactly("Priority Review");
        assertThat(adminApplicantService.getApplicantOptions().tags())
                .extracting("name")
                .contains("Priority Review");

        var filtered = adminApplicantService.getApplicantsPage(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                adminId,
                tagId,
                null,
                null,
                null,
                null,
                AdminApplicantSortField.APPLICANT_NAME,
                AdminSortDirection.ASC,
                1,
                30
        );
        assertThat(filtered.items())
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.applicantName()).isEqualTo("Alpha Candidate");
                    assertThat(item.assignedAdminName()).isEqualTo("Dev Admin");
                    assertThat(item.tags()).extracting("name").containsExactly("Priority Review");
                });

        var allSorted = adminApplicantService.getApplicantsPage(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                AdminApplicantSortField.APPLICANT_NAME,
                AdminSortDirection.ASC,
                1,
                30
        );
        assertThat(allSorted.items()).extracting("applicantName")
                .startsWith("Alpha Candidate", "Zulu Candidate");

        var withoutTag = adminApplicantService.removeTag(alphaApplicationId, tagId, adminId);
        assertThat(withoutTag.tags()).isEmpty();
        assertThat(applicationEventService.getEvents(alphaApplicationId))
                .extracting("eventType")
                .contains("ASSIGNEE_CHANGED", "TAG_ADDED", "TAG_REMOVED");
    }

    @Test
    void keepsSavedApplicantSearchesPrivateAndValidatesTheirFilters() {
        var admins = adminAccountRepository.findAllByActiveTrueOrderByDisplayNameAsc();
        assertThat(admins).hasSizeGreaterThanOrEqualTo(2);
        Long ownerId = admins.get(0).getId();
        Long otherAdminId = admins.get(1).getId();

        var saved = savedSearchService.create(
                ownerId,
                new CreateAdminApplicantSavedSearchRequest(
                        "My review queue",
                        Map.of(
                                "reviewStatus", "NEW",
                                "assignedAdminId", ownerId.toString(),
                                "sort", "UPDATED_AT",
                                "direction", "DESC"
                        )
                )
        );

        assertThat(savedSearchService.getSavedSearches(ownerId))
                .singleElement()
                .satisfies(search -> {
                    assertThat(search.id()).isEqualTo(saved.id());
                    assertThat(search.filters()).containsEntry("reviewStatus", "NEW");
                });
        assertThat(savedSearchService.getSavedSearches(otherAdminId)).isEmpty();
        assertThatThrownBy(() -> savedSearchService.delete(otherAdminId, saved.id()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThatThrownBy(() -> savedSearchService.create(
                ownerId,
                new CreateAdminApplicantSavedSearchRequest("Unsafe", Map.of("redirectUrl", "https://evil.example"))
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        savedSearchService.delete(ownerId, saved.id());
        assertThat(savedSearchService.getSavedSearches(ownerId)).isEmpty();
    }

    @Test
    void appliesBulkAssignmentAndTagsAtomicallyWithAuditHistory() {
        var firstCandidate = createCandidateAccount("Bulk One", "bulk.one@example.com", "010-1818-1919");
        var secondCandidate = createCandidateAccount("Bulk Two", "bulk.two@example.com", "010-2020-2121");
        Long firstId = applicationDraftService.submit(
                1001L,
                firstCandidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "Bulk candidate one provides enough detail for an enterprise batch operation.",
                        "coreStrength", "Bulk candidate one validates atomic assignment."
                ))
        ).applicationId();
        Long secondId = applicationDraftService.submit(
                1001L,
                secondCandidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "Bulk candidate two provides a second valid target for batch changes.",
                        "coreStrength", "Bulk candidate two validates audit coverage."
                ))
        ).applicationId();
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        assertThatThrownBy(() -> adminApplicantService.bulkUpdate(
                new BulkApplicantOperationRequest(
                        List.of(firstId, 999999999L),
                        BulkApplicantOperation.ASSIGN,
                        adminId,
                        null,
                        null
                ),
                adminId
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(adminApplicantService.getApplicant(firstId).assignedAdminId()).isNull();

        var tagResult = adminApplicantService.bulkUpdate(
                new BulkApplicantOperationRequest(
                        List.of(firstId, secondId, firstId),
                        BulkApplicantOperation.ADD_TAG,
                        null,
                        "Fast Track",
                        null
                ),
                adminId
        );
        assertThat(tagResult.requestedCount()).isEqualTo(2);
        assertThat(tagResult.changedCount()).isEqualTo(2);
        Long tagId = adminApplicantService.getApplicantOptions().tags().stream()
                .filter(tag -> tag.name().equals("Fast Track"))
                .findFirst()
                .orElseThrow()
                .id();

        var assignmentResult = adminApplicantService.bulkUpdate(
                new BulkApplicantOperationRequest(
                        List.of(firstId, secondId),
                        BulkApplicantOperation.ASSIGN,
                        adminId,
                        null,
                        null
                ),
                adminId
        );
        assertThat(assignmentResult.changedCount()).isEqualTo(2);

        var filtered = adminApplicantService.getApplicantsPage(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                adminId,
                tagId,
                null,
                null,
                null,
                null,
                AdminApplicantSortField.APPLICANT_NAME,
                AdminSortDirection.ASC,
                1,
                30
        );
        assertThat(filtered.items()).hasSize(2);
        assertThat(applicationEventService.getEvents(firstId)).extracting("eventType")
                .contains("TAG_ADDED", "ASSIGNEE_CHANGED");
        assertThat(applicationEventService.getEvents(secondId)).extracting("eventType")
                .contains("TAG_ADDED", "ASSIGNEE_CHANGED");
    }

    @Test
    void detectsConcurrentApplicationStateUpdates() {
        var candidate = createCandidateAccount("Concurrent Kim", "concurrent@example.com", "010-2323-4545");
        Long applicationId = applicationDraftService.submit(
                1001L,
                candidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "I have implemented concurrent workflow controls for enterprise systems.",
                        "coreStrength", "I prevent stale writes from silently replacing newer decisions."
                ))
        ).applicationId();

        var firstEntityManager = entityManagerFactory.createEntityManager();
        var staleEntityManager = entityManagerFactory.createEntityManager();
        try {
            firstEntityManager.getTransaction().begin();
            staleEntityManager.getTransaction().begin();
            var firstApplication = firstEntityManager.find(
                    com.viberec.api.recruitment.application.domain.Application.class,
                    applicationId
            );
            var staleApplication = staleEntityManager.find(
                    com.viberec.api.recruitment.application.domain.Application.class,
                    applicationId
            );

            firstApplication.updateReviewStatus(ApplicationReviewStatus.IN_REVIEW, "First update wins.");
            firstEntityManager.getTransaction().commit();

            staleApplication.updateReviewStatus(ApplicationReviewStatus.REJECTED, "Stale update must fail.");
            assertThatThrownBy(() -> staleEntityManager.getTransaction().commit())
                    .isInstanceOf(jakarta.persistence.RollbackException.class)
                    .hasCauseInstanceOf(OptimisticLockException.class);
        } finally {
            if (firstEntityManager.getTransaction().isActive()) {
                firstEntityManager.getTransaction().rollback();
            }
            if (staleEntityManager.getTransaction().isActive()) {
                staleEntityManager.getTransaction().rollback();
            }
            firstEntityManager.close();
            staleEntityManager.close();
        }
    }
}
