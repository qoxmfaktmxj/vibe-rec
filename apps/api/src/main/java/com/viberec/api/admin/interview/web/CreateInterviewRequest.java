package com.viberec.api.admin.interview.web;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateInterviewRequest(
        @NotNull Long jobPostingStepId,
        OffsetDateTime scheduledAt,
        @Size(max = 2000) String note
) {
}
