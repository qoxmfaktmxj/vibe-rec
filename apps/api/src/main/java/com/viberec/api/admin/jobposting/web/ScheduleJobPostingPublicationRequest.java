package com.viberec.api.admin.jobposting.web;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record ScheduleJobPostingPublicationRequest(
        @NotNull OffsetDateTime publishAt
) {
}
