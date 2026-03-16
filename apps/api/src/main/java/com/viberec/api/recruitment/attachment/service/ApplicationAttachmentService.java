package com.viberec.api.recruitment.attachment.service;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.attachment.domain.ApplicationAttachment;
import com.viberec.api.recruitment.attachment.repository.ApplicationAttachmentRepository;
import com.viberec.api.recruitment.attachment.web.ApplicationAttachmentResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ApplicationAttachmentService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationAttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;

    public ApplicationAttachmentService(
            ApplicationRepository applicationRepository,
            ApplicationAttachmentRepository attachmentRepository,
            FileStorageService fileStorageService
    ) {
        this.applicationRepository = applicationRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ApplicationAttachmentResponse upload(Long applicationId, MultipartFile file) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        if (application.isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot attach files to a submitted application.");
        }

        String storedFileName = fileStorageService.store(file);
        String storagePath = fileStorageService.load(storedFileName).toString();

        ApplicationAttachment attachment = new ApplicationAttachment(
                application,
                storedFileName,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                storagePath
        );

        ApplicationAttachment saved = attachmentRepository.save(attachment);
        return toResponse(saved);
    }

    public List<ApplicationAttachmentResponse> getAttachments(Long applicationId) {
        return attachmentRepository.findByApplicationId(applicationId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long attachmentId) {
        ApplicationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found."));

        if (attachment.getApplication().isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete attachments from a submitted application.");
        }

        fileStorageService.delete(attachment.getFileName());
        attachmentRepository.delete(attachment);
    }

    public ApplicationAttachment getAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found."));
    }

    private ApplicationAttachmentResponse toResponse(ApplicationAttachment attachment) {
        return new ApplicationAttachmentResponse(
                attachment.getId(),
                attachment.getApplication().getId(),
                attachment.getOriginalName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                attachment.getCreatedAt()
        );
    }
}
