package com.viberec.api.admin.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminLoginRequest;
import com.viberec.api.admin.auth.web.AdminSignupRequest;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

class AdminAuthorizationTests extends IntegrationTestBase {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private CandidateAuthService candidateAuthService;

    @Autowired
    private CandidateSessionRepository candidateSessionRepository;

    @Autowired
    private CandidateAccountRepository candidateAccountRepository;

    @Autowired
    private ApplicationDraftService applicationDraftService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private String adminSessionToken;
    private Long submittedApplicationId;

    @BeforeEach
    void setUp() {
        String reviewerUsername = "reviewer-" + System.nanoTime();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
        adminSessionToken = adminAuthService.signup(new AdminSignupRequest(reviewerUsername, "Reviewer", "reviewer-pass")).sessionToken();
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        CandidateAccount candidate = registerCandidate("Authorization Kim", "authorization.kim@example.com", "010-2222-3333");
        submittedApplicationId = applicationDraftService.submit(
                1001L,
                candidate,
                validSubmitRequest(1001L, Map.of(
                        "introduction", "I have shipped recruiter tools and interview workflows in enterprise environments.",
                        "coreStrength", "I can formalize ad-hoc review steps into deterministic systems."
                ))
        ).applicationId();
    }

    @Test
    void adminRoleCanViewApplicantsAndJobPostingSteps() throws Exception {
        var applicantsResponse = mockMvc.perform(
                        get("/api/admin/applicants")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();
        var stepsResponse = mockMvc.perform(
                        get("/api/admin/job-postings/1001/steps")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();
        var dashboardResponse = mockMvc.perform(
                        get("/api/admin/dashboard")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        assertThat(objectMapper.readTree(applicantsResponse.getContentAsString())).isNotEmpty();
        var steps = objectMapper.readTree(stepsResponse.getContentAsString());
        assertThat(steps).isNotEmpty();
        assertThat(steps.get(0).get("id").asLong()).isPositive();
        assertThat(objectMapper.readTree(dashboardResponse.getContentAsString()).get("reviewQueue")).isNotNull();
    }

    @Test
    void jobPostingPermissionsSeparateReadAndManageAccess() throws Exception {
        var adminSession = adminAuthService.getSession(adminSessionToken);
        assertThat(adminSession.permissions())
                .contains("JOB_POSTING_VIEW")
                .doesNotContain("JOB_POSTING_MANAGE");

        mockMvc.perform(
                        get("/api/admin/job-postings")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk());

        var stepsResponse = mockMvc.perform(
                        get("/api/admin/job-postings/1001/steps")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();
        long interviewStepId = 0L;
        for (var step : objectMapper.readTree(stepsResponse.getContentAsString())) {
            if ("INTERVIEW".equals(step.get("stepType").asText())) {
                interviewStepId = step.get("id").asLong();
                break;
            }
        }
        assertThat(interviewStepId).isPositive();

        mockMvc.perform(
                        get("/api/admin/job-postings/1001/steps/" + interviewStepId + "/scorecard")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk());

        mockMvc.perform(
                        get("/api/admin/job-postings/1001/preview")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk());

        mockMvc.perform(
                        put("/api/admin/job-postings/1001/steps/" + interviewStepId + "/scorecard")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/admin/job-postings")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/admin/job-postings/1001/clone")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        put("/api/admin/job-postings/1001/publication")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"publishAt\":\"2099-01-01T00:00:00Z\"}")
                )
                .andExpect(status().isForbidden());

        String superAdminSessionToken = adminAuthService.login(
                new AdminLoginRequest("admin", "admin")
        ).sessionToken();
        assertThat(adminAuthService.getSession(superAdminSessionToken).permissions())
                .contains("JOB_POSTING_VIEW", "JOB_POSTING_MANAGE");

        mockMvc.perform(
                        put("/api/admin/job-postings/1001")
                                .contextPath("/api")
                                .header("X-Admin-Session", superAdminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    void dataPrivacyQueueIsRestrictedToSuperAdmin() throws Exception {
        assertThat(adminAuthService.getSession(adminSessionToken).permissions())
                .doesNotContain("DATA_PRIVACY_MANAGE");
        mockMvc.perform(
                        get("/api/admin/data-requests")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isForbidden());

        String superAdminSessionToken = adminAuthService.login(
                new AdminLoginRequest("admin", "admin")
        ).sessionToken();
        assertThat(adminAuthService.getSession(superAdminSessionToken).permissions())
                .contains("DATA_PRIVACY_MANAGE");
        mockMvc.perform(
                        get("/api/admin/data-requests")
                                .contextPath("/api")
                                .header("X-Admin-Session", superAdminSessionToken)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk());
    }

    @Test
    void adminRoleCannotReviewApplicantsOrMakeFinalDecisions() throws Exception {
        mockMvc.perform(
                        patch("/api/admin/applicants/" + submittedApplicationId + "/review-status")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "reviewStatus": "IN_REVIEW",
                                          "reviewNote": "Attempting a restricted action."
                                        }
                                        """)
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/admin/applicants/" + submittedApplicationId + "/final-decision")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "finalStatus": "OFFER_MADE",
                                          "note": "Attempting another restricted action."
                                        }
                                        """)
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/admin/applicants/" + submittedApplicationId + "/notifications/1/retry")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        patch("/api/admin/applicants/" + submittedApplicationId + "/assignee")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"adminAccountId\":null}")
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/admin/applicants/" + submittedApplicationId + "/tags")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"Priority\"}")
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        post("/api/admin/applicants/bulk")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "applicationIds": [%d],
                                          "operation": "ASSIGN",
                                          "adminAccountId": null
                                        }
                                        """.formatted(submittedApplicationId))
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        get("/api/admin/applicants/saved-searches")
                                .contextPath("/api")
                                .header("X-Admin-Session", adminSessionToken)
                )
                .andExpect(status().isOk());
    }

    @Test
    void protectedAdminEndpointsRejectMissingSessionToken() throws Exception {
        mockMvc.perform(
                        get("/api/admin/applicants")
                                .contextPath("/api")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointsWithoutPermissionAnnotationStillRequireAuthentication() throws Exception {
        mockMvc.perform(
                        get("/api/admin/auth/session")
                                .contextPath("/api")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicAdminSignupEndpointIsUnavailable() throws Exception {
        mockMvc.perform(
                        post("/api/admin/auth/signup")
                                .contextPath("/api")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "username": "public-admin",
                                          "displayName": "Public Admin",
                                          "password": "password123"
                                        }
                                        """)
                )
                .andExpect(status().isNotFound());
    }

    @Test
    void adminLoginEndpointRemainsPublic() throws Exception {
        mockMvc.perform(
                        post("/api/admin/auth/login")
                                .contextPath("/api")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "username": "admin",
                                          "password": "admin"
                                        }
                                        """)
                )
                .andExpect(status().isOk());
    }

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        verifyCandidateEmail(email);
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }
}
