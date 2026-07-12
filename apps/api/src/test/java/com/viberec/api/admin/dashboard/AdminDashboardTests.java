package com.viberec.api.admin.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.applicant.web.UpdateApplicantAssigneeRequest;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.dashboard.service.AdminDashboardService;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.repository.ApplicationEventRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.evaluation.repository.EvaluationRepository;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class AdminDashboardTests extends IntegrationTestBase {

    @Autowired private AdminDashboardService adminDashboardService;
    @Autowired private AdminApplicantService adminApplicantService;
    @Autowired private ApplicationDraftService applicationDraftService;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationResumeRawRepository applicationResumeRawRepository;
    @Autowired private ApplicationEventRepository applicationEventRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private EvaluationRepository evaluationRepository;
    @Autowired private NotificationLogRepository notificationLogRepository;
    @Autowired private JobPostingRepository jobPostingRepository;
    @Autowired private AdminAccountRepository adminAccountRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanOperationalData() {
        evaluationRepository.deleteAll();
        interviewRepository.deleteAll();
        notificationLogRepository.deleteAll();
        applicationEventRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
    }

    @Test
    void aggregatesTheEntireRecruitmentQueueAndReviewSlaOnTheServer() {
        var firstCandidate = createCandidateAccount("Dashboard One", "dashboard.one@example.com", "010-3030-3131");
        var secondCandidate = createCandidateAccount("Dashboard Two", "dashboard.two@example.com", "010-3232-3333");
        Long firstId = applicationDraftService.submit(
                1001L,
                firstCandidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "Dashboard candidate one has enough experience to validate full queue aggregation.",
                        "coreStrength", "Dashboard candidate one validates decision and assignment counts."
                ))
        ).applicationId();
        Long secondId = applicationDraftService.submit(
                1001L,
                secondCandidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "Dashboard candidate two validates overdue review SLA calculations.",
                        "coreStrength", "Dashboard candidate two remains in the new review queue."
                ))
        ).applicationId();
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        adminApplicantService.updateReviewStatus(
                firstId,
                new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.IN_REVIEW, "Review started.")
        );
        adminApplicantService.updateReviewStatus(
                firstId,
                new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.PASSED, "Review passed.")
        );
        adminApplicantService.updateAssignee(firstId, new UpdateApplicantAssigneeRequest(adminId), adminId);
        jdbcTemplate.update(
                "update recruit.application set submitted_at = current_timestamp - interval '4 days' where id = ?",
                secondId
        );

        var dashboard = adminDashboardService.getDashboard();

        assertThat(dashboard.applications().total()).isEqualTo(2);
        assertThat(dashboard.applications().submitted()).isEqualTo(2);
        assertThat(dashboard.reviewQueue().newApplicants()).isEqualTo(1);
        assertThat(dashboard.reviewQueue().passed()).isEqualTo(1);
        assertThat(dashboard.reviewQueue().unassigned()).isEqualTo(1);
        assertThat(dashboard.reviewQueue().overdue()).isEqualTo(1);
        assertThat(dashboard.reviewQueue().decisionPending()).isEqualTo(1);
        assertThat(dashboard.notifications().pending()).isZero();
        assertThat(dashboard.notifications().retrying()).isZero();
        assertThat(dashboard.notifications().exhausted()).isZero();
        assertThat(dashboard.jobPostings().total()).isEqualTo(jobPostingRepository.count());
        assertThat(dashboard.reviewSlaHours()).isEqualTo(72);
    }
}
