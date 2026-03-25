package com.viberec.api.recruitment.attachment.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.recruitment.attachment.domain.ApplicationAttachment;
import com.viberec.api.recruitment.attachment.service.AttachmentService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ApplicationAttachmentController {

    private final CandidateAuthService candidateAuthService;
    private final AttachmentService attachmentService;

    public ApplicationAttachmentController(CandidateAuthService candidateAuthService, AttachmentService attachmentService) {
        this.candidateAuthService = candidateAuthService;
        this.attachmentService = attachmentService;
    }

    @PostMapping("/job-postings/{jobPostingId}/application-draft/attachments")
    public AttachmentResponse uploadDraftAttachment(
            @PathVariable Long jobPostingId,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @RequestParam("file") MultipartFile file
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return attachmentService.uploadDraftAttachment(jobPostingId, candidateAccount, file);
    }

    @PostMapping("/applications/{applicationId}/attachments")
    public AttachmentResponse uploadAttachment(
            @PathVariable Long applicationId,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @RequestParam("file") MultipartFile file
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return attachmentService.upload(applicationId, candidateAccount, file);
    }

    @GetMapping("/applications/{applicationId}/attachments")
    public List<AttachmentResponse> getAttachments(
            @PathVariable Long applicationId,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return attachmentService.getAttachments(applicationId, candidateAccount);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public void deleteAttachment(
            @PathVariable Long attachmentId,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        attachmentService.deleteAttachment(attachmentId, candidateAccount);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        ApplicationAttachment attachment = attachmentService.getAttachment(attachmentId, candidateAccount);
        Resource resource = attachmentService.loadAttachmentResource(attachment.getStoragePath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getOriginalName() + "\"")
                .body(resource);
    }
}
