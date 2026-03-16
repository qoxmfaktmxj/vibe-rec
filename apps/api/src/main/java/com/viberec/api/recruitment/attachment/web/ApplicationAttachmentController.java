package com.viberec.api.recruitment.attachment.web;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.attachment.domain.ApplicationAttachment;
import com.viberec.api.recruitment.attachment.service.ApplicationAttachmentService;
import java.nio.file.Path;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ApplicationAttachmentController {

    private final ApplicationRepository applicationRepository;
    private final ApplicationAttachmentService attachmentService;

    public ApplicationAttachmentController(
            ApplicationRepository applicationRepository,
            ApplicationAttachmentService attachmentService
    ) {
        this.applicationRepository = applicationRepository;
        this.attachmentService = attachmentService;
    }

    @PostMapping("/job-postings/{jobPostingId}/application-draft/attachments")
    public ApplicationAttachmentResponse upload(
            @PathVariable Long jobPostingId,
            @RequestParam("applicantEmail") String applicantEmail,
            @RequestParam("file") MultipartFile file
    ) {
        Application application = applicationRepository
                .findByJobPostingIdAndApplicantEmailIgnoreCase(jobPostingId, applicantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        return attachmentService.upload(application.getId(), file);
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        ApplicationAttachment attachment = attachmentService.getAttachment(id);
        Path filePath = Path.of(attachment.getStoragePath());
        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on storage.");
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + attachment.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/attachments/{id}")
    public void delete(@PathVariable Long id) {
        attachmentService.delete(id);
    }
}
