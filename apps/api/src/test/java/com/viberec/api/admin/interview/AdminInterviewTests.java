package com.viberec.api.admin.interview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.interview.service.AdminInterviewService;
import com.viberec.api.admin.interview.web.CreateInterviewRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.server.ResponseStatusException;

class AdminInterviewTests extends IntegrationTestBase {

    @Autowired
    private AdminInterviewService adminInterviewService;

    @Autowired
    private ApplicationDraftService applicationDraftService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private JobPostingStepRepository jobPostingStepRepository;

    @BeforeEach
    void cleanApplications() {
        interviewRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
    }

    @Test
    void createsInterviewFromStepOrderWhenStepIdIsNotProvided() {
        Long applicationId = applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Interview Kim",
                        "interview.kim@example.com",
                        "010-1010-2020",
                        Map.of(
                                "introduction", "I have coordinated recruiter interviews and candidate pipelines across several teams.",
                                "coreStrength", "I can turn evolving hiring steps into stable, testable workflows."
                        ),
                        null, null, null, null, null
                )
        ).applicationId();

        var step = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).getFirst();

        var response = adminInterviewService.createInterview(
                applicationId,
                new CreateInterviewRequest(null, step.getStepOrder(), null, "Create from step order")
        );

        assertThat(response.applicationId()).isEqualTo(applicationId);
        assertThat(response.jobPostingStepId()).isEqualTo(step.getId());
    }

    @Test
    void rejectsInterviewStepFromAnotherJobPosting() {
        Long applicationId = applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Mismatch Kim",
                        "mismatch.kim@example.com",
                        "010-3030-4040",
                        Map.of(
                                "introduction", "I have reviewed recruiting workflows with cross-posting edge cases.",
                                "coreStrength", "I look for contract mismatches between admin tooling and backend rules."
                        ),
                        null, null, null, null, null
                )
        ).applicationId();

        var foreignStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1002L).getFirst();

        assertThatThrownBy(() -> adminInterviewService.createInterview(
                applicationId,
                new CreateInterviewRequest(foreignStep.getId(), null, null, "Should fail")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("does not belong");
    }
}
