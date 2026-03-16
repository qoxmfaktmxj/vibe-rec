package com.viberec.api.admin.attachment.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.recruitment.attachment.service.AttachmentService;
import com.viberec.api.recruitment.attachment.service.FileStorageService;
import com.viberec.api.recruitment.attachment.web.AttachmentResponse;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminAttachmentController {

    private final AdminAuthService adminAuthService;
    private final AttachmentService attachmentService;
    private final FileStorageService fileStorageService;
    private final com.viberec.api.recruitment.attachment.repository.ApplicationAttachmentRepository attachmentRepository;

    public AdminAttachmentController(
            AdminAuthService adminAuthService,
            AttachmentService attachmentService,
            FileStorageService fileStorageService,
            com.viberec.api.recruitment.attachment.repository.ApplicationAttachmentRepository attachmentRepository
    ) {
        this.adminAuthService = adminAuthService;
        this.attachmentService = attachmentService;
        this.fileStorageService = fileStorageService;
        this.attachmentRepository = attachmentRepository;
    }

    @GetMapping("/applicants/{applicationId}/attachments")
    public List<AttachmentResponse> getAttachments(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long applicationId
    ) {
        authorize(sessionToken);
        return attachmentService.getAttachments(applicationId);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long attachmentId
    ) {
        authorize(sessionToken);

        var attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다."));

        Resource resource = fileStorageService.loadAsResource(attachment.getStoragePath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + attachment.getOriginalFilename() + "\"")
                .body(resource);
    }

    private void authorize(String sessionToken) {
        adminAuthService.getSession(sessionToken);
    }
}
