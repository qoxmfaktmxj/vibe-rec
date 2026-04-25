package com.viberec.api.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Objects;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

class VibeRecDemoSmokeTests extends IntegrationTestBase {

    private static final String CANDIDATE_EMAIL = "viberec.demo.smoke@example.com";

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void completesCandidateAndAdminCoreDemoLoopThroughHttpApi() throws Exception {
        JsonNode jobPostings = getJson("/api/job-postings", null);
        assertThat(jobPostings)
                .anySatisfy(posting -> assertThat(posting.get("id").asLong()).isEqualTo(1003L));

        JsonNode jobPosting = getJson("/api/job-postings/1003", null);
        assertThat(jobPosting.get("id").asLong()).isEqualTo(1003L);
        assertThat(jobPosting.get("title").asText()).isNotBlank();

        JsonNode candidateSignup = postJson(
                "/api/candidate/auth/signup",
                null,
                """
                {
                  "name": "VibeRec Demo Smoke",
                  "email": "viberec.demo.smoke@example.com",
                  "phone": "010-4242-2525",
                  "password": "candidate-pass"
                }
                """
        );
        String candidateSessionToken = candidateSignup.get("sessionToken").asText();
        assertThat(candidateSessionToken).isNotBlank();

        putJson(
                "/api/candidate/profile",
                "X-Candidate-Session",
                candidateSessionToken,
                """
                {
                  "introductionTemplate": "I modernize recruiting systems from candidate entry to hiring decisions.",
                  "coreStrengthTemplate": "I connect product, API, and operations into a reliable hiring workflow.",
                  "careerYears": 6,
                  "educations": [
                    {
                      "id": null,
                      "institution": "Korea University",
                      "degree": "BACHELOR",
                      "fieldOfStudy": "Computer Science",
                      "startDate": "2016-03-01",
                      "endDate": "2020-02-28",
                      "description": "Software engineering focus",
                      "sortOrder": 0
                    }
                  ],
                  "experiences": [
                    {
                      "id": null,
                      "company": "HireFlow Labs",
                      "position": "Backend Engineer",
                      "startDate": "2020-03-01",
                      "endDate": null,
                      "description": "Built applicant workflow APIs and recruiter tools.",
                      "sortOrder": 0
                    }
                  ],
                  "skills": [
                    {
                      "id": null,
                      "skillName": "Spring Boot",
                      "proficiency": "ADVANCED",
                      "years": 5,
                      "sortOrder": 0
                    }
                  ],
                  "certifications": [],
                  "languages": []
                }
                """
        );
        JsonNode profile = getJson("/api/candidate/profile", header("X-Candidate-Session", candidateSessionToken));
        assertThat(profile.get("careerYears").asInt()).isEqualTo(6);
        assertThat(profile.get("skills")).hasSize(1);

        JsonNode submittedApplication = postJson(
                "/api/job-postings/1003/application-submit",
                header("X-Candidate-Session", candidateSessionToken),
                """
                {
                  "resumePayload": {
                    "introduction": "I have delivered applicant workflow APIs, profile reuse, and recruiter review screens for production hiring teams.",
                    "coreStrength": "I can close the loop from candidate submission to final hiring decision with safe API contracts.",
                    "careerYears": 6
                  },
                  "educations": [
                    {
                      "id": null,
                      "institution": "Korea University",
                      "degree": "BACHELOR",
                      "fieldOfStudy": "Computer Science",
                      "startDate": "2016-03-01",
                      "endDate": "2020-02-28",
                      "description": "Software engineering focus",
                      "sortOrder": 0
                    }
                  ],
                  "experiences": [
                    {
                      "id": null,
                      "company": "HireFlow Labs",
                      "position": "Backend Engineer",
                      "startDate": "2020-03-01",
                      "endDate": null,
                      "description": "Built applicant workflow APIs and recruiter tools.",
                      "sortOrder": 0
                    }
                  ],
                  "skills": [
                    {
                      "id": null,
                      "skillName": "Spring Boot",
                      "proficiency": "ADVANCED",
                      "years": 5,
                      "sortOrder": 0
                    }
                  ],
                  "certifications": [],
                  "languages": []
                }
                """
        );
        Long applicationId = submittedApplication.get("applicationId").asLong();
        assertThat(submittedApplication.get("status").asText()).isEqualTo("SUBMITTED");
        assertThat(submittedApplication.get("submittedAt").isNull()).isFalse();

        JsonNode applicationDetail = getJson("/api/job-postings/1003/application", header("X-Candidate-Session", candidateSessionToken));
        assertThat(applicationDetail.get("applicationId").asLong()).isEqualTo(applicationId);
        assertThat(applicationDetail.get("resumePayload").get("coreStrength").asText()).contains("final hiring decision");

        JsonNode myApplications = getJson("/api/candidate/applications", header("X-Candidate-Session", candidateSessionToken));
        assertThat(myApplications)
                .anySatisfy(application -> assertThat(application.get("applicationId").asLong()).isEqualTo(applicationId));

        JsonNode adminLogin = postJson(
                "/api/admin/auth/login",
                null,
                """
                {
                  "username": "admin",
                  "password": "admin"
                }
                """
        );
        String adminSessionToken = adminLogin.get("sessionToken").asText();
        assertThat(adminSessionToken).isNotBlank();

        JsonNode applicantPage = getJson(
                "/api/admin/applicants?applicationStatus=SUBMITTED&applicantEmail=viberec.demo.smoke@example.com",
                header("X-Admin-Session", adminSessionToken)
        );
        assertThat(applicantPage.get("items"))
                .anySatisfy(applicant -> assertThat(applicant.get("applicationId").asLong()).isEqualTo(applicationId));

        JsonNode adminApplicantDetail = getJson("/api/admin/applicants/" + applicationId, header("X-Admin-Session", adminSessionToken));
        assertThat(adminApplicantDetail.get("applicantEmail").asText()).isEqualTo(CANDIDATE_EMAIL);
        assertThat(adminApplicantDetail.get("reviewStatus").asText()).isEqualTo("NEW");

        JsonNode inReview = patchJson(
                "/api/admin/applicants/" + applicationId + "/review-status",
                header("X-Admin-Session", adminSessionToken),
                """
                {
                  "reviewStatus": "IN_REVIEW",
                  "reviewNote": "Demo smoke: recruiter review started."
                }
                """
        );
        assertThat(inReview.get("reviewStatus").asText()).isEqualTo("IN_REVIEW");

        JsonNode passedReview = patchJson(
                "/api/admin/applicants/" + applicationId + "/review-status",
                header("X-Admin-Session", adminSessionToken),
                """
                {
                  "reviewStatus": "PASSED",
                  "reviewNote": "Demo smoke: candidate passed document review."
                }
                """
        );
        assertThat(passedReview.get("reviewStatus").asText()).isEqualTo("PASSED");

        JsonNode interview = postJson(
                "/api/admin/applicants/" + applicationId + "/interviews",
                header("X-Admin-Session", adminSessionToken),
                """
                {
                  "jobPostingStepId": null,
                  "stepOrder": 2,
                  "scheduledAt": null,
                  "note": "Demo smoke: first technical interview."
                }
                """
        );
        Long interviewId = interview.get("id").asLong();
        assertThat(interview.get("applicationId").asLong()).isEqualTo(applicationId);
        assertThat(interview.get("status").asText()).isEqualTo("SCHEDULED");

        JsonNode completedInterview = patchJson(
                "/api/admin/interviews/" + interviewId,
                header("X-Admin-Session", adminSessionToken),
                """
                {
                  "status": "COMPLETED",
                  "note": "Demo smoke: interview completed."
                }
                """
        );
        assertThat(completedInterview.get("status").asText()).isEqualTo("COMPLETED");

        JsonNode evaluation = postJson(
                "/api/admin/interviews/" + interviewId + "/evaluations",
                header("X-Admin-Session", adminSessionToken),
                """
                {
                  "score": 5,
                  "comment": "Demo smoke: strong pass.",
                  "result": "PASS"
                }
                """
        );
        assertThat(evaluation.get("interviewId").asLong()).isEqualTo(interviewId);
        assertThat(evaluation.get("result").asText()).isEqualTo("PASS");

        JsonNode interviews = getJson("/api/admin/applicants/" + applicationId + "/interviews", header("X-Admin-Session", adminSessionToken));
        assertThat(interviews)
                .singleElement()
                .satisfies(response -> {
                    assertThat(response.get("status").asText()).isEqualTo("COMPLETED");
                    assertThat(response.get("evaluations")).hasSize(1);
                });

        JsonNode finalDecision = postJson(
                "/api/admin/applicants/" + applicationId + "/final-decision",
                header("X-Admin-Session", adminSessionToken),
                """
                {
                  "finalStatus": "OFFER_MADE",
                  "note": "Demo smoke: offer made after interview."
                }
                """
        );
        assertThat(finalDecision.get("applicationId").asLong()).isEqualTo(applicationId);
        assertThat(finalDecision.get("finalStatus").asText()).isEqualTo("OFFER_MADE");

        JsonNode decidedApplicantDetail = getJson("/api/admin/applicants/" + applicationId, header("X-Admin-Session", adminSessionToken));
        assertThat(decidedApplicantDetail.get("finalStatus").asText()).isEqualTo("OFFER_MADE");
        assertThat(decidedApplicantDetail.get("finalNote").asText()).contains("offer made");
    }

    private JsonNode getJson(String url, Header header) throws Exception {
        var request = get(url).contextPath("/api").accept(MediaType.APPLICATION_JSON);
        if (header != null) {
            request.header(header.name(), header.value());
        }
        return readJson(mockMvc.perform(request)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    }

    private JsonNode postJson(String url, Header header, String content) throws Exception {
        var request = post(url)
                .contextPath("/api")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);
        if (header != null) {
            request.header(header.name(), header.value());
        }
        return readJson(mockMvc.perform(request)
                .andExpect(status().is2xxSuccessful())
                .andReturn()
                .getResponse()
                .getContentAsString());
    }

    private void putJson(String url, String headerName, String headerValue, String content) throws Exception {
        mockMvc.perform(put(url)
                        .contextPath("/api")
                        .header(headerName, headerValue)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isOk());
    }

    private JsonNode patchJson(String url, Header header, String content) throws Exception {
        var request = patch(url)
                .contextPath("/api")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(content);
        if (header != null) {
            request.header(header.name(), header.value());
        }
        return readJson(mockMvc.perform(request)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    }

    private JsonNode readJson(String json) throws Exception {
        assertThat(json).isNotBlank();
        return objectMapper.readTree(json);
    }

    private Header header(String name, String value) {
        return new Header(name, Objects.requireNonNull(value));
    }

    private record Header(String name, String value) {}
}
