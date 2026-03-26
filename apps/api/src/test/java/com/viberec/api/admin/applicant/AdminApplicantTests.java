package com.viberec.api.admin.applicant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.admin.hiring.service.AdminHiringDecisionService;
import com.viberec.api.admin.hiring.web.FinalDecisionRequest;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.support.IntegrationTestBase;
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

    @BeforeEach
    void cleanApplications() {
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
    }

    @Test
    void returnsApplicantsWithSearchAndStatusFilters() {
        var backendCandidate = createCandidateAccount("Backend Kim", "backend.kim@example.com", "010-1111-2222");
        var draftCandidate = createCandidateAccount("Draft Park", "draft.park@example.com", "010-3333-4444");

        applicationDraftService.submit(
                1001L,
                backendCandidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have built enterprise recruitment backends and migration tooling for hiring teams.",
                                "coreStrength", "I can stabilize hiring workflows while systems are being replaced."
                        ),
                        null, null, null, null, null
                )
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
                    new SaveApplicationDraftRequest(
                            Map.of(
                                    "introduction", "Paged applicant " + index + " has enough background to satisfy the submit validation rules.",
                                    "coreStrength", "Paged applicant " + index + " keeps the admin review queue structured."
                            ),
                            null, null, null, null, null
                    )
            );
        }

        var firstPage = adminApplicantService.getApplicantsPage(
                null,
                ApplicationStatus.SUBMITTED,
                null,
                null,
                null,
                null,
                "paged candidate",
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
                "paged candidate",
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
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have owned applicant workflows and recruiter tools across multiple hiring platforms.",
                                "coreStrength", "I can convert business review rules into predictable operating flows."
                        ),
                        null, null, null, null, null
                )
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
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have delivered applicant workflow APIs with explicit decision contracts.",
                                "coreStrength", "I keep admin detail responses aligned with persisted final decision state."
                        ),
                        null, null, null, null, null
                )
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
}
