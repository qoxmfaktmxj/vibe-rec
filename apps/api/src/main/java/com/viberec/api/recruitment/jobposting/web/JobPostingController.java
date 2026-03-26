package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.recruitment.application.service.CandidateApplicationQueryService;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.CandidateApplicationDetailResponse;
import com.viberec.api.recruitment.application.web.ApplicationDraftResponse;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.service.JobPostingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/job-postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;
    private final ApplicationDraftService applicationDraftService;
    private final CandidateApplicationQueryService candidateApplicationQueryService;
    private final CandidateAuthService candidateAuthService;

    public JobPostingController(
            JobPostingService jobPostingService,
            ApplicationDraftService applicationDraftService,
            CandidateApplicationQueryService candidateApplicationQueryService,
            CandidateAuthService candidateAuthService
    ) {
        this.jobPostingService = jobPostingService;
        this.applicationDraftService = applicationDraftService;
        this.candidateApplicationQueryService = candidateApplicationQueryService;
        this.candidateAuthService = candidateAuthService;
    }

    @GetMapping
    public List<JobPostingSummaryResponse> getJobPostings() {
        return jobPostingService.getPublishedJobPostings();
    }

    @GetMapping("/{id}")
    public JobPostingDetailResponse getJobPosting(@PathVariable Long id) {
        return jobPostingService.getJobPosting(id);
    }

    @GetMapping("/{id}/application")
    public CandidateApplicationDetailResponse getCandidateApplication(
            @PathVariable Long id,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateApplicationQueryService.getCandidateApplication(id, candidateAccount);
    }

    @GetMapping("/{id}/questions")
    public List<JobPostingQuestionResponse> getQuestions(@PathVariable Long id) {
        return jobPostingService.getQuestionsForJobPosting(id);
    }

    @PostMapping("/{id}/application-draft")
    public ApplicationDraftResponse saveApplicationDraft(
            @PathVariable Long id,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @Valid @RequestBody SaveApplicationDraftRequest request
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return applicationDraftService.saveDraft(id, candidateAccount, request);
    }

    @PostMapping("/{id}/application-submit")
    public ApplicationDraftResponse submitApplication(
            @PathVariable Long id,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @Valid @RequestBody SaveApplicationDraftRequest request
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return applicationDraftService.submit(id, candidateAccount, request);
    }
}
