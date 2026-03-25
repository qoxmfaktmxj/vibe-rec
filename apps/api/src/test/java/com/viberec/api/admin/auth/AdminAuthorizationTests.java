package com.viberec.api.admin.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminSignupRequest;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
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
                new SaveApplicationDraftRequest(Map.of(
                        "introduction", "I have shipped recruiter tools and interview workflows in enterprise environments.",
                        "coreStrength", "I can formalize ad-hoc review steps into deterministic systems."
                ), null, null, null, null, null)
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

        assertThat(objectMapper.readTree(applicantsResponse.getContentAsString())).isNotEmpty();
        var steps = objectMapper.readTree(stepsResponse.getContentAsString());
        assertThat(steps).isNotEmpty();
        assertThat(steps.get(0).get("id").asLong()).isPositive();
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

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }
}
