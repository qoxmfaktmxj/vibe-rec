package com.viberec.api.recruitment.attachment.web;

import com.viberec.api.recruitment.attachment.service.AttachmentService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/applications/{applicationId}/attachments")
    public AttachmentResponse uploadAttachment(
            @PathVariable Long applicationId,
            @RequestParam("file") MultipartFile file
    ) {
        return attachmentService.upload(applicationId, file);
    }

    @GetMapping("/applications/{applicationId}/attachments")
    public List<AttachmentResponse> getAttachments(@PathVariable Long applicationId) {
        return attachmentService.getAttachments(applicationId);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public void deleteAttachment(@PathVariable Long attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
    }
}
