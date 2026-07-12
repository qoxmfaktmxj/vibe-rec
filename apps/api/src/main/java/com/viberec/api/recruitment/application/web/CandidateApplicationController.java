package com.viberec.api.recruitment.application.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.recruitment.application.service.CandidateApplicationQueryService;
import com.viberec.api.recruitment.application.service.CandidateApplicationCommandService;
import com.viberec.api.recruitment.interview.service.CandidateInterviewCalendarService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/candidate/applications")
public class CandidateApplicationController {

    private final CandidateApplicationQueryService candidateApplicationQueryService;
    private final CandidateAuthService candidateAuthService;
    private final CandidateApplicationCommandService candidateApplicationCommandService;
    private final CandidateInterviewCalendarService candidateInterviewCalendarService;

    public CandidateApplicationController(
            CandidateApplicationQueryService candidateApplicationQueryService,
            CandidateAuthService candidateAuthService,
            CandidateApplicationCommandService candidateApplicationCommandService,
            CandidateInterviewCalendarService candidateInterviewCalendarService
    ) {
        this.candidateApplicationQueryService = candidateApplicationQueryService;
        this.candidateAuthService = candidateAuthService;
        this.candidateApplicationCommandService = candidateApplicationCommandService;
        this.candidateInterviewCalendarService = candidateInterviewCalendarService;
    }

    @GetMapping
    public List<CandidateApplicationSummaryResponse> getCandidateApplications(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateApplicationQueryService.getCandidateApplications(candidateAccount);
    }

    @PatchMapping("/{id}/withdraw")
    public WithdrawApplicationResponse withdrawApplication(
            @PathVariable Long id,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @Valid @RequestBody WithdrawApplicationRequest request
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateApplicationCommandService.withdraw(id, candidateAccount, request);
    }

    @GetMapping("/{applicationId}/interviews/{interviewId}/calendar")
    public ResponseEntity<byte[]> downloadInterviewCalendar(
            @PathVariable Long applicationId,
            @PathVariable Long interviewId,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        CandidateInterviewCalendarService.CalendarDownload calendar = candidateInterviewCalendarService.createCalendar(
                applicationId,
                interviewId,
                candidateAccount
        );
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar;charset=UTF-8"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(calendar.filename()).build().toString()
                )
                .body(calendar.content());
    }
}
