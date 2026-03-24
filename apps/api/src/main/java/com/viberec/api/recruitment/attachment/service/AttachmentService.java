package com.viberec.api.recruitment.attachment.service;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.attachment.domain.ApplicationAttachment;
import com.viberec.api.recruitment.attachment.repository.ApplicationAttachmentRepository;
import com.viberec.api.recruitment.attachment.web.AttachmentResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AttachmentService {

    private static final int MAX_ATTACHMENTS_PER_APPLICATION = 3;

    private final ApplicationRepository applicationRepository;
    private final ApplicationAttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;

    public AttachmentService(
            ApplicationRepository applicationRepository,
            ApplicationAttachmentRepository attachmentRepository,
            FileStorageService fileStorageService
    ) {
        this.applicationRepository = applicationRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public AttachmentResponse upload(Long applicationId, MultipartFile file) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));

        if (application.isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 제출된 지원서에는 파일을 첨부할 수 없습니다.");
        }

        long currentCount = attachmentRepository.countByApplicationId(applicationId);
        if (currentCount >= MAX_ATTACHMENTS_PER_APPLICATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "첨부파일은 최대 " + MAX_ATTACHMENTS_PER_APPLICATION + "개까지 업로드할 수 있습니다.");
        }

        FileStorageService.StoredFileResult stored = fileStorageService.store(file);

        ApplicationAttachment attachment = new ApplicationAttachment(
                application,
                stored.fileName(),
                stored.originalName(),
                stored.contentType(),
                stored.fileSize(),
                stored.storagePath()
        );

        ApplicationAttachment saved = attachmentRepository.save(attachment);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getAttachments(Long applicationId) {
        return attachmentRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        ApplicationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다."));

        if (attachment.getApplication().isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 제출된 지원서의 첨부파일은 삭제할 수 없습니다.");
        }

        fileStorageService.delete(attachment.getStoragePath());
        attachmentRepository.delete(attachment);
    }

    private AttachmentResponse toResponse(ApplicationAttachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getApplication().getId(),
                attachment.getOriginalName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                attachment.getCreatedAt()
        );
    }
}
