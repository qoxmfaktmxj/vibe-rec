package com.viberec.api.recruitment.attachment.web;

import java.time.OffsetDateTime;

public record AttachmentResponse(
        Long id,
        Long applicationId,
        String originalFilename,
        String contentType,
        long fileSizeBytes,
        OffsetDateTime uploadedAt
) {
}
