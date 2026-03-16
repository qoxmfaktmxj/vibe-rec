package com.viberec.api.recruitment.attachment.web;

import java.time.OffsetDateTime;

public record ApplicationAttachmentResponse(
        Long id,
        Long applicationId,
        String originalName,
        String contentType,
        long fileSize,
        OffsetDateTime createdAt
) {
}
