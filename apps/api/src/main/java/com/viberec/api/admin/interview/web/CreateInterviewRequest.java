package com.viberec.api.admin.interview.web;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateInterviewRequest(
        Long jobPostingStepId,
        Short stepOrder,
        OffsetDateTime scheduledAt,
        @Size(max = 2000) String note
) {
}
