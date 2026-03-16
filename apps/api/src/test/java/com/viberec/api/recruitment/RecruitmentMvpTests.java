package com.viberec.api.recruitment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.service.JobPostingService;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
class RecruitmentMvpTests {

    @Autowired
    private JobPostingService jobPostingService;

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
    void returnsSeededPublishedJobPostings() {
        var jobPostings = jobPostingService.getPublishedJobPostings();

        assertThat(jobPostings)
                .hasSize(2)
                .first()
                .extracting("id", "title")
                .containsExactly(1001L, "Platform Backend Engineer");
    }

    @Test
    void savesApplicationDraftForOpenJobPosting() {
        var response = applicationDraftService.saveDraft(
                1001L,
                new SaveApplicationDraftRequest(
                        "Kim Recruit",
                        "kim.recruit@example.com",
                        "010-1234-5678",
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects.",
                                "careerYears", 6
                        ),
                        null, null, null, null, null
                )
        );

        assertThat(response.jobPostingId()).isEqualTo(1001L);
        assertThat(response.applicantEmail()).isEqualTo("kim.recruit@example.com");
        assertThat(response.submittedAt()).isNull();
        assertThat(applicationRepository.findByJobPostingIdAndApplicantEmailIgnoreCase(1001L, "kim.recruit@example.com")).isPresent();
        assertThat(applicationResumeRawRepository.findById(response.applicationId())).isPresent();
    }

    @Test
    void submitsApplicationForOpenJobPosting() {
        var response = applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Kim Recruit",
                        "kim.submit@example.com",
                        "010-1234-5678",
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects for enterprise hiring teams.",
                                "coreStrength", "I translate hiring operations into resilient platform workflows.",
                                "careerYears", 6
                        ),
                        null, null, null, null, null
                )
        );

        assertThat(response.status().name()).isEqualTo("SUBMITTED");
        assertThat(response.submittedAt()).isNotNull();
        assertThat(applicationRepository.findByJobPostingIdAndApplicantEmailIgnoreCase(1001L, "kim.submit@example.com"))
                .isPresent()
                .get()
                .extracting("status")
                .hasToString("SUBMITTED");
    }

    @Test
    void rejectsDraftSaveAfterSubmission() {
        applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Locked Applicant",
                        "locked@example.com",
                        "010-5555-7777",
                        Map.of(
                                "introduction", "I have managed several applicant pipelines and legacy modernization programs.",
                                "coreStrength", "I maintain strong delivery discipline across hiring operations."
                        ),
                        null, null, null, null, null
                )
        );

        assertThatThrownBy(() -> applicationDraftService.saveDraft(
                1001L,
                new SaveApplicationDraftRequest(
                        "Locked Applicant",
                        "locked@example.com",
                        "010-5555-7777",
                        Map.of("introduction", "Trying to edit after submit."),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Application is already submitted for this posting.");
    }

    @Test
    void rejectsDraftSaveForClosedJobPosting() {
        assertThatThrownBy(() -> applicationDraftService.saveDraft(
                1002L,
                new SaveApplicationDraftRequest(
                        "Closed Applicant",
                        "closed@example.com",
                        "010-9999-0000",
                        Map.of("portfolioUrl", "https://example.com"),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Applications are available only for open job postings.");
    }
}
