package com.viberec.api.recruitment.interview.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.interview.domain.Interview;
import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CandidateInterviewCalendarService {

    private static final DateTimeFormatter ICALENDAR_DATE_TIME = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private final InterviewRepository interviewRepository;

    public CandidateInterviewCalendarService(InterviewRepository interviewRepository) {
        this.interviewRepository = interviewRepository;
    }

    public CalendarDownload createCalendar(Long applicationId, Long interviewId, CandidateAccount candidateAccount) {
        Interview interview = interviewRepository.findById(interviewId)
                .filter(found -> found.getApplication().getId().equals(applicationId))
                .filter(found -> found.getApplication().getCandidateAccount() != null)
                .filter(found -> found.getApplication().getCandidateAccount().getId().equals(candidateAccount.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found."));

        if (interview.getScheduledAt() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The interview has not been scheduled yet.");
        }

        OffsetDateTime startsAt = interview.getScheduledAt();
        OffsetDateTime endsAt = startsAt.plusMinutes(interview.getDurationMinutes());
        String summary = interview.getApplication().getJobPosting().getTitle()
                + " - " + interview.getJobPostingStep().getTitle();
        String location = firstNonBlank(interview.getLocation(), interview.getOnlineLink());

        StringBuilder calendar = new StringBuilder()
                .append("BEGIN:VCALENDAR\r\n")
                .append("VERSION:2.0\r\n")
                .append("PRODID:-//Vibe Rec//Candidate Interview//KO\r\n")
                .append("CALSCALE:GREGORIAN\r\n")
                .append("METHOD:PUBLISH\r\n")
                .append("BEGIN:VEVENT\r\n")
                .append("UID:interview-").append(interview.getId()).append("@vibe-rec\r\n")
                .append("DTSTAMP:").append(format(OffsetDateTime.now())).append("\r\n")
                .append("DTSTART:").append(format(startsAt)).append("\r\n")
                .append("DTEND:").append(format(endsAt)).append("\r\n")
                .append("SUMMARY:").append(escape(summary)).append("\r\n")
                .append("DESCRIPTION:").append(escape("Vibe Rec interview schedule")).append("\r\n");
        if (location != null) {
            calendar.append("LOCATION:").append(escape(location)).append("\r\n");
        }
        if (interview.getOnlineLink() != null) {
            calendar.append("URL:").append(interview.getOnlineLink()).append("\r\n");
        }
        calendar.append("STATUS:")
                .append(interview.getStatus() == InterviewStatus.CANCELLED ? "CANCELLED" : "CONFIRMED")
                .append("\r\n")
                .append("END:VEVENT\r\n")
                .append("END:VCALENDAR\r\n");

        return new CalendarDownload(
                "vibe-rec-interview-" + interview.getId() + ".ics",
                calendar.toString().getBytes(StandardCharsets.UTF_8)
        );
    }

    private String format(OffsetDateTime value) {
        return value.withOffsetSameInstant(ZoneOffset.UTC).format(ICALENDAR_DATE_TIME);
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n");
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second == null || second.isBlank() ? null : second;
    }

    public record CalendarDownload(String filename, byte[] content) {
    }
}
