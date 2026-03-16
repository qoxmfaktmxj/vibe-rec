package com.viberec.api.admin.applicant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
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
import org.springframework.web.server.ResponseStatusException;

class AdminApplicantTests extends IntegrationTestBase {

    @Autowired
    private AdminApplicantService adminApplicantService;

    @Autowired
    private ApplicationDraftService applicationDraftService;

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
        applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Backend Kim",
                        "backend.kim@example.com",
                        "010-1111-2222",
                        Map.of(
                                "introduction", "I have built enterprise recruitment backends and migration tooling for hiring teams.",
                                "coreStrength", "I can stabilize hiring workflows while systems are being replaced."
                        ),
                        null, null, null, null, null
                )
        );
        applicationDraftService.saveDraft(
                1001L,
                new SaveApplicationDraftRequest(
                        "Draft Park",
                        "draft.park@example.com",
                        "010-3333-4444",
                        Map.of("introduction", "draft only"),
                        null, null, null, null, null
                )
        );

        var submittedApplicants = adminApplicantService.getApplicants(
                null,
                ApplicationStatus.SUBMITTED,
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
    void updatesReviewStatusForSubmittedApplication() {
        var submittedApplication = applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Review Kim",
                        "review.kim@example.com",
                        "010-7777-8888",
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
    void rejectsReviewStatusChangeForDraftApplication() {
        var draftApplication = applicationDraftService.saveDraft(
                1001L,
                new SaveApplicationDraftRequest(
                        "Draft Only",
                        "draft.only@example.com",
                        "010-9999-0000",
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
                .hasMessageContaining("Only submitted applications can enter recruiter review.");
    }
}
