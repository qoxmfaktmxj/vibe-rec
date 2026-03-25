package com.viberec.api.recruitment.attachment.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.attachment.domain.ApplicationAttachment;
import com.viberec.api.recruitment.attachment.repository.ApplicationAttachmentRepository;
import com.viberec.api.recruitment.attachment.web.AttachmentResponse;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
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
    public AttachmentResponse uploadDraftAttachment(Long jobPostingId, CandidateAccount candidateAccount, MultipartFile file) {
        Application application = applicationRepository.findByJobPostingIdAndCandidateAccountId(jobPostingId, candidateAccount.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Create an application draft before uploading attachments."));
        return createAttachment(application, file);
    }

    @Transactional
    public AttachmentResponse upload(Long applicationId, CandidateAccount candidateAccount, MultipartFile file) {
        Application application = loadOwnedApplication(applicationId, candidateAccount.getId());
        return createAttachment(application, file);
    }

    public List<AttachmentResponse> getAttachments(Long applicationId, CandidateAccount candidateAccount) {
        Application application = loadOwnedApplication(applicationId, candidateAccount.getId());
        return listAttachments(application.getId());
    }

    public List<AttachmentResponse> getAttachments(Long applicationId) {
        loadApplication(applicationId);
        return listAttachments(applicationId);
    }

    @Transactional
    public void deleteAttachment(Long attachmentId, CandidateAccount candidateAccount) {
        ApplicationAttachment attachment = loadOwnedAttachment(attachmentId, candidateAccount.getId());
        if (attachment.getApplication().isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submitted applications cannot change attachments.");
        }

        fileStorageService.delete(attachment.getStoragePath());
        attachmentRepository.delete(attachment);
    }

    public ApplicationAttachment getAttachment(Long attachmentId, CandidateAccount candidateAccount) {
        return loadOwnedAttachment(attachmentId, candidateAccount.getId());
    }

    public Resource loadAttachmentResource(String storagePath) {
        return fileStorageService.loadAsResource(storagePath);
    }

    private AttachmentResponse createAttachment(Application application, MultipartFile file) {
        if (application.isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submitted applications cannot change attachments.");
        }

        long currentCount = attachmentRepository.countByApplicationId(application.getId());
        if (currentCount >= MAX_ATTACHMENTS_PER_APPLICATION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No more than " + MAX_ATTACHMENTS_PER_APPLICATION + " attachments are allowed per application."
            );
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

        return toResponse(attachmentRepository.save(attachment));
    }

    private List<AttachmentResponse> listAttachments(Long applicationId) {
        return attachmentRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId).stream()
                .map(this::toResponse)
                .toList();
    }

    private Application loadApplication(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));
    }

    private Application loadOwnedApplication(Long applicationId, Long candidateAccountId) {
        Application application = loadApplication(applicationId);
        if (!application.belongsToCandidate(candidateAccountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this application.");
        }
        return application;
    }

    private ApplicationAttachment loadOwnedAttachment(Long attachmentId, Long candidateAccountId) {
        ApplicationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found."));
        if (!attachment.getApplication().belongsToCandidate(candidateAccountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this attachment.");
        }
        return attachment;
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
