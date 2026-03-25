package com.viberec.api.candidate.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.attachment.service.AttachmentService;
import com.viberec.api.support.IntegrationTestBase;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

class CandidateApplicationAuthorizationTests extends IntegrationTestBase {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private CandidateAuthService candidateAuthService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void cleanApplications() {
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void requiresCandidateSessionForDraftSave() throws Exception {
        mockMvc.perform(
                        post("/api/job-postings/1001/application-draft")
                                .contextPath("/api")
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept(MediaType.APPLICATION_JSON)
                                .content("{\"resumePayload\":{\"introduction\":\"I am trying without a session.\"}}")
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    void enforcesCandidateOwnershipForApplicationAttachmentRead() throws Exception {
        String ownerSession = candidateAuthService.signup(
                new CandidateSignupRequest("Owner Kim", "owner.kim@example.com", "010-7777-8888", "password123")
        ).sessionToken();
        String otherSession = candidateAuthService.signup(
                new CandidateSignupRequest("Other Kim", "other.kim@example.com", "010-9999-0000", "password123")
        ).sessionToken();

        var draftResponse = mockMvc.perform(
                        post("/api/job-postings/1001/application-draft")
                                .contextPath("/api")
                                .header("X-Candidate-Session", ownerSession)
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept(MediaType.APPLICATION_JSON)
                                .content("{\"resumePayload\":{\"introduction\":\"I have candidate-owned draft access.\"}}")
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();
        long applicationId = objectMapper.readTree(
                draftResponse.getContentAsString(StandardCharsets.UTF_8)
        ).get("applicationId").asLong();

        attachmentService.uploadDraftAttachment(
                1001L,
                candidateAuthService.requireActiveAccount(ownerSession),
                new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes(StandardCharsets.UTF_8))
        );

        mockMvc.perform(
                        get("/api/applications/" + applicationId + "/attachments")
                                .contextPath("/api")
                                .header("X-Candidate-Session", ownerSession)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk());

        mockMvc.perform(
                        get("/api/applications/" + applicationId + "/attachments")
                                .contextPath("/api")
                                .header("X-Candidate-Session", otherSession)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isForbidden());
    }
}

