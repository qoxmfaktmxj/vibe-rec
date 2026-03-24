package com.viberec.api.admin.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminLoginRequest;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.support.IntegrationTestBase;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

class AdminAuthorizationTests extends IntegrationTestBase {

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicationDraftService applicationDraftService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @LocalServerPort
    private int port;

    private String adminSessionToken;
    private Long submittedApplicationId;

    @BeforeEach
    void setUp() {
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        adminAccountRepository.upsertDevAccount("reviewer", "Reviewer", "reviewer-pass", "ADMIN");
        adminSessionToken = adminAuthService.login(new AdminLoginRequest("reviewer", "reviewer-pass")).sessionToken();
        submittedApplicationId = applicationDraftService.submit(
                1001L,
                new SaveApplicationDraftRequest(
                        "Authorization Kim",
                        "authorization.kim@example.com",
                        "010-2222-3333",
                        Map.of(
                                "introduction", "I have shipped recruiter tools and interview workflows in enterprise environments.",
                                "coreStrength", "I can formalize ad-hoc review steps into deterministic systems."
                        ),
                        null, null, null, null, null
                )
        ).applicationId();
    }

    @Test
    void adminRoleCanViewApplicantsAndJobPostingSteps() {
        HttpResponse<String> applicantsResponse = sendRequest(
                "/api/admin/applicants",
                "GET",
                null
        );
        HttpResponse<String> stepsResponse = sendRequest(
                "/api/admin/job-postings/1001/steps",
                "GET",
                null
        );

        assertThat(applicantsResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(stepsResponse.statusCode()).isEqualTo(HttpStatus.OK.value());

        JobPostingStepResponse[] steps = readBody(
                stepsResponse.body(),
                JobPostingStepResponse[].class
        );

        assertThat(steps).isNotEmpty();
        assertThat(steps[0].id()).isNotNull();
    }

    @Test
    void adminRoleCannotReviewApplicantsOrMakeFinalDecisions() {
        HttpResponse<String> reviewResponse = sendRequest(
                "/api/admin/applicants/" + submittedApplicationId + "/review-status",
                "PATCH",
                """
                        {
                          "reviewStatus": "IN_REVIEW",
                          "reviewNote": "Attempting a restricted action."
                        }
                        """
        );
        HttpResponse<String> finalDecisionResponse = sendRequest(
                "/api/admin/applicants/" + submittedApplicationId + "/final-decision",
                "POST",
                """
                        {
                          "finalStatus": "OFFER_MADE",
                          "note": "Attempting another restricted action."
                        }
                        """
        );

        assertThat(reviewResponse.statusCode()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(finalDecisionResponse.statusCode()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    void protectedAdminEndpointsRejectMissingSessionToken() {
        HttpResponse<String> response = sendRequest(
                "/api/admin/applicants",
                "GET",
                null,
                false
        );

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    private <T> T readBody(String body, Class<T> bodyType) {
        try {
            return objectMapper.readValue(body, bodyType);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to parse test response.", exception);
        }
    }

    private HttpResponse<String> sendRequest(String path, String method, String body) {
        return sendRequest(path, method, body, true);
    }

    private HttpResponse<String> sendRequest(String path, String method, String body, boolean includeSessionToken) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create("http://127.0.0.1:" + port + path))
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);

            if (includeSessionToken) {
                builder.header("X-Admin-Session", adminSessionToken);
            }

            if (body != null) {
                builder.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            }

            HttpRequest request = builder.method(
                    method,
                    body == null
                            ? HttpRequest.BodyPublishers.noBody()
                            : HttpRequest.BodyPublishers.ofString(body)
            ).build();

            return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to call test endpoint.", exception);
        }
    }
}
